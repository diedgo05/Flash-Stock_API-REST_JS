const { sequelize, Purchase, Offer } = require('../models');
const crypto = require('crypto');const { calculateCurrentPrice } = require('../services/priceEngine');
const { getIO } = require('../config/socket');

// ── POST /api/purchases ───────────────────────────────────────────────────────
// Usuario intenta comprar una oferta
const createPurchase = async (req, res, next) => {
  const { offer_id, quantity = 1 } = req.body;
  const user_id = req.user.id;

  // TRANSACCIÓN ATÓMICA: bloquea el row para evitar race conditions
  const transaction = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
  });

  try {
    // 🔒 SELECT FOR UPDATE: bloquea este row hasta que hagamos commit o rollback
    const offer = await Offer.findOne({
      where: { id: offer_id, status: 'ACTIVE' },
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    // Validaciones dentro de la transacción
    if (!offer) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Oferta no disponible o ya terminó' });
    }

    if (new Date() > new Date(offer.end_time)) {
      await offer.update({ status: 'EXPIRED' }, { transaction });
      await transaction.commit();
      return res.status(400).json({ success: false, message: 'Esta oferta ya expiró' });
    }

    if (offer.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: offer.stock === 0 ? 'Producto agotado' : `Solo quedan ${offer.stock} unidades`
      });
    }

    // ✅ Todo bien: procesar compra
    const pricePaid = calculateCurrentPrice(offer);
    const newStock = offer.stock - quantity;
    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
    const newStatus = newStock === 0 ? 'SOLD_OUT' : 'ACTIVE';

    // Actualizar stock y estado de la oferta
    await offer.update(
      { stock: newStock, status: newStatus, current_price: pricePaid },
      { transaction }
    );

    // Crear el registro de compra
    const purchase = await Purchase.create({
      offer_id,
      user_id,
      price_paid: pricePaid,
      quantity,
      ticket_code: ticketCode,
      status: 'PENDING',
      purchased_at: new Date()
    }, { transaction });

    await transaction.commit();

    // 📡 Emitir actualización de stock a todos en la room (después del commit)
    try {
      const io = getIO();
      io.to(`offer_${offer_id}`).emit('stock_update', {
        offerId: offer_id,
        newStock,
        status: newStatus
      });

      if (newStatus === 'SOLD_OUT') {
        io.to(`offer_${offer_id}`).emit('offer_ended', {
          offerId: offer_id,
          reason: 'SOLD_OUT'
        });
      }
    } catch (_) { /* Socket puede no estar inicializado */ }

    res.status(201).json({
      success: true,
      message: '¡Compra exitosa!',
      data: {
        purchase: {
          id: purchase.id,
          ticket_code: ticketCode,
          price_paid: pricePaid,
          quantity,
          purchased_at: purchase.purchased_at
        },
        offer: {
          id: offer.id,
          name: offer.name,
          store_id: offer.store_id
        }
      }
    });

  } catch (error) {
    // Si algo falla, Sequelize hace rollback automático
    try { await transaction.rollback(); } catch (_) {}
    next(error);
  }
};

// ── GET /api/purchases/my-history ─────────────────────────────────────────────
// Historial de compras del usuario autenticado
const getUserPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Offer,
          as: 'offer',
          attributes: ['id', 'name', 'photo_url'],
          include: [
            {
              model: require('../models').Store,
              as: 'store',
              attributes: ['id', 'store_name', 'logo_url', 'address']
            }
          ]
        }
      ],
      order: [['purchased_at', 'DESC']]
    });

    res.json({ success: true, data: { purchases } });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/purchases/:ticketCode/redeem ───────────────────────────────────
// La tienda escanea/ingresa el código y marca el ticket como canjeado
const redeemTicket = async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({
      where: { ticket_code: req.params.ticketCode },
      include: [{ model: Offer, as: 'offer', where: { store_id: req.store.id } }]
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado o no pertenece a tu tienda' });
    }

    if (purchase.status === 'REDEEMED') {
      return res.status(400).json({ success: false, message: 'Este ticket ya fue canjeado' });
    }

    if (purchase.status === 'EXPIRED') {
      return res.status(400).json({ success: false, message: 'Este ticket está expirado' });
    }

    await purchase.update({ status: 'REDEEMED' });

    res.json({
      success: true,
      message: '✅ Ticket canjeado exitosamente',
      data: { purchase }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPurchase, getUserPurchases, redeemTicket };