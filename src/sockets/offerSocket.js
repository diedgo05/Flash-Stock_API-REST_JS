const { Offer, OfferViewer } = require('../models');
const { calculateCurrentPrice } = require('../services/priceEngine');
const { startOfferTimer } = require('../services/offerService');

const handleOfferSocket = (io, socket) => {

  // ── EVENTO: Usuario entra a ver una oferta ────────────────────────────────
  socket.on('join_offer', async ({ offerId, userId }) => {
    try {
      const roomName = `offer_${offerId}`;
      socket.join(roomName);

      // Registrar viewer (upsert: si el socket_id ya existe, actualiza)
      await OfferViewer.upsert({ offer_id: offerId, socket_id: socket.id });

      // Buscar estado actual de la oferta
      const offer = await Offer.findByPk(offerId);

      if (!offer || !['ACTIVE', 'SCHEDULED'].includes(offer.status)) {
        socket.emit('offer_error', { message: 'Oferta no disponible' });
        return;
      }

      const currentPrice = calculateCurrentPrice(offer);

      // Emitir estado inicial SOLO al que acaba de unirse
      socket.emit('offer_state', {
        offerId,
        currentPrice,
        stock: offer.stock,
        status: offer.status,
        endsAt: offer.end_time,
        startsAt: offer.start_time
      });

      // Emitir viewer count actualizado a TODA la room
      const viewerCount = await OfferViewer.count({ where: { offer_id: offerId } });
      io.to(roomName).emit('viewer_count', { offerId, count: viewerCount });

    } catch (error) {
      console.error('Error en join_offer:', error.message);
      socket.emit('offer_error', { message: 'Error al conectar a la oferta' });
    }
  });

  // ── EVENTO: Usuario sale de una oferta ────────────────────────────────────
  socket.on('leave_offer', async ({ offerId }) => {
    try {
      socket.leave(`offer_${offerId}`);
      await OfferViewer.destroy({ where: { socket_id: socket.id } });

      const viewerCount = await OfferViewer.count({ where: { offer_id: offerId } });
      io.to(`offer_${offerId}`).emit('viewer_count', { offerId, count: viewerCount });
    } catch (error) {
      console.error('Error en leave_offer:', error.message);
    }
  });

  // ── EVENTO: Desconexión abrupta (cerró la app, perdió internet) ───────────
  socket.on('disconnect', async () => {
    try {
      // Buscar en qué oferta estaba este socket antes de borrarlo
      const viewer = await OfferViewer.findOne({ where: { socket_id: socket.id } });

      if (viewer) {
        const offerId = viewer.offer_id;
        await viewer.destroy();

        const viewerCount = await OfferViewer.count({ where: { offer_id: offerId } });
        io.to(`offer_${offerId}`).emit('viewer_count', { offerId, count: viewerCount });
      }
    } catch (error) {
      console.error('Error en disconnect cleanup:', error.message);
    }
  });
};

module.exports = { handleOfferSocket };