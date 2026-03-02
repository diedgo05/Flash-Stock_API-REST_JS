const { Offer, OfferViewer } = require('../models');
const { getIO } = require('../config/socket');
const { calculateCurrentPrice } = require('./priceEngine');

// Mapa de timers activos para poder cancelarlos si es necesario
// { offer_id: intervalId }
const activeTimers = new Map();

/**
 * Inicia el timer de una oferta activa.
 * Emite el precio actualizado cada 5 segundos por WebSocket.
 * Cuando la oferta termina, limpia todo y emite el evento final.
 */

const startOfferTimer = (offer) => {
  // Evitar timers duplicados
  if (activeTimers.has(offer.id)) {
    console.log(`⚠️ Timer ya existe para oferta ${offer.id}`);
    return;
  }
  
  const INTERVAL_MS = 5000; // Emite precio cada 5 segundos

const interval = setInterval(async () => {
    try {
        const freshOffer = await Offer.findByPk(offer.id);
        if (!freshOffer || freshOffer.status !== 'ACTIVE') {
            stopOfferTimer(offer.id);
            return;
        }

        // 1. Calculamos el precio PRIMERO
        const currentPrice = calculateCurrentPrice(freshOffer);
        await freshOffer.update({ current_price: currentPrice });

        // 2. Obtenemos los viewers
        const viewerCount = await OfferViewer.count({ where: { offer_id: freshOffer.id } });

        // 3. Emitimos TODO junto con el nombre de evento que Android espera
        const io = getIO();
        io.to(`offer_${offer.id}`).emit('offer_state', {
            offerId: freshOffer.id,
            currentPrice: currentPrice,
            stock: freshOffer.stock,
            status: freshOffer.status,
            viewers: viewerCount, // <--- Los ojitos
            endsAt: freshOffer.end_time,
            startsAt: freshOffer.start_time
        });

        console.log(`📡 Broadcast oferta ${offer.id}: $${currentPrice} - 👀 ${viewerCount}`);

    } catch (error) {
        console.error(`❌ Error en timer:`, error.message);
    }
}, INTERVAL_MS);

  activeTimers.set(offer.id, interval);
  console.log(`▶️ Timer iniciado para oferta: ${offer.id}`);
};

/**
 * Detiene el timer de una oferta y limpia los viewers de esa room
 */
const stopOfferTimer = async (offerId) => {
  const interval = activeTimers.get(offerId);
  if (interval) {
    clearInterval(interval);
    activeTimers.delete(offerId);
    // Limpiar viewers de esta oferta
    await OfferViewer.destroy({ where: { offer_id: offerId } });
    console.log(`⏹️ Timer detenido para oferta: ${offerId}`);
  }
};

/**
 * Al arrancar el servidor, reactiva los timers de ofertas que
 * estaban ACTIVE antes del reinicio (persistencia de estado)
 */
const reactivateActiveOffers = async () => {
  try {
    const activeOffers = await Offer.findAll({ where: { status: 'ACTIVE' } });

    for (const offer of activeOffers) {
      // Si ya expiró mientras el servidor estaba apagado, actualizarla
      if (new Date() > new Date(offer.end_time)) {
        await offer.update({ status: 'EXPIRED' });
      } else {
        startOfferTimer(offer);
      }
    }

    console.log(`🔄 ${activeOffers.length} ofertas activas reactivadas`);
  } catch (error) {
    console.error('❌ Error reactivando ofertas:', error.message);
  }
};

module.exports = { startOfferTimer, stopOfferTimer, reactivateActiveOffers };