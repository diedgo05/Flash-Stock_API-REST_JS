const { Op } = require('sequelize');
const { Offer, Store, Category, Purchase } = require('../models');
const { startOfferTimer } = require('../services/offerService');

//  GET /api/offers 
// Ofertas activas públicas (las que ve el usuario en el home)
const getActiveOffers = async (req, res, next) => {
  try {
    const { city, category_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { status: 'ACTIVE' };

    // Filtrar por categoría si se envía
    if (category_id) whereClause.category_id = category_id;

    const includeStore = {
      model: Store,
      as: 'store',
      attributes: ['id', 'store_name', 'logo_url', 'address', 'city'],
      // Filtrar por ciudad si se envía
      where: city ? { city, is_active: true } : { is_active: true }
    };

    const { count, rows: offers } = await Offer.findAndCountAll({
      where: whereClause,
      include: [
        includeStore,
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ],
      order: [['end_time', 'ASC']], // Las que vencen antes, primero
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/offers/:id ───────────────────────────────────────────────────────
// Detalle de una oferta (para la pantalla de compra)
const getOfferById = async (req, res, next) => {
  try {
    const offer = await Offer.findByPk(req.params.id, {
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'store_name', 'logo_url', 'address', 'phone', 'city']
        },
        { model: Category, as: 'category', attributes: ['id', 'name'] }
      ]
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    res.json({ success: true, data: { offer } });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/offers ──────────────────────────────────────────────────────────
// La tienda crea una nueva oferta (requiere authStore)
const createOffer = async (req, res, next) => {
  try {
    const {
      name, description, category_id,
      initial_price, min_price, stock,
      start_time, end_time
    } = req.body;

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const offer = await Offer.create({
      store_id: req.store.id, // Viene del middleware authStore
      name,
      description,
      category_id,
      initial_price,
      min_price,
      current_price: initial_price, // Se inicializa aquí también por claridad
      stock,
      start_time,
      end_time,
      photo_url
    });

    // Si la oferta empieza ahora o ya pasó la start_time, activar timer
    const now = new Date();
    if (new Date(start_time) <= now) {
      await offer.update({ status: 'ACTIVE' });
      startOfferTimer(offer); // Inicia el motor de precios y WebSocket
    }
    // Si es futura, un cron job (o scheduler) la activará en el futuro

    res.status(201).json({
      success: true,
      message: 'Oferta creada exitosamente',
      data: { offer }
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/offers/store/mine ────────────────────────────────────────────────
// La tienda ve todas sus propias ofertas (panel de tienda)
const getStoreOffers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { store_id: req.store.id };
    if (status) whereClause.status = status;

    const { count, rows: offers } = await Offer.findAndCountAll({
      where: whereClause,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        offers,
        pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/offers/:id/cancel ──────────────────────────────────────────────
// La tienda cancela una oferta (solo si está SCHEDULED o ACTIVE)
const cancelOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findOne({
      where: { id: req.params.id, store_id: req.store.id }
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    if (!['SCHEDULED', 'ACTIVE'].includes(offer.status)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar una oferta en estado ${offer.status}`
      });
    }

    await offer.update({ status: 'CANCELLED' });

    // Notificar por WebSocket a todos los que estén viendo la oferta
    const { getIO } = require('../config/socket');
    try {
      const io = getIO();
      io.to(`offer_${offer.id}`).emit('offer_ended', {
        offerId: offer.id,
        reason: 'CANCELLED'
      });
    } catch (_) { /* Socket puede no estar inicializado en tests */ }

    res.json({ success: true, message: 'Oferta cancelada', data: { offer } });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/offers/:id/purchases ─────────────────────────────────────────────
// La tienda ve las compras de una oferta específica
const getOfferPurchases = async (req, res, next) => {
  try {
    // Verificar que la oferta pertenece a la tienda
    const offer = await Offer.findOne({
      where: { id: req.params.id, store_id: req.store.id }
    });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    const purchases = await Purchase.findAll({
      where: { offer_id: offer.id },
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'name', 'last_name', 'phone']
        }
      ],
      order: [['purchased_at', 'DESC']]
    });

    res.json({ success: true, data: { purchases } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveOffers,
  getOfferById,
  createOffer,
  getStoreOffers,
  cancelOffer,
  getOfferPurchases
};