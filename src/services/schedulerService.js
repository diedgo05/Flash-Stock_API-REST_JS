const { Op } = require('sequelize');
const { Offer } = require('../models');
const { startOfferTimer } = require('./offerService');

/**
 * Revisa cada 30 segundos si hay ofertas SCHEDULED cuya start_time ya llegó.
 * Si las encuentra, las activa y arranca su timer de precios.
 */
const startScheduler = () => {
  setInterval(async () => {
    try {
      const now = new Date();

      const offersToActivate = await Offer.findAll({
        where: {
          status: 'SCHEDULED',
          start_time: { [Op.lte]: now }
        }
      });

      for (const offer of offersToActivate) {
        await offer.update({ status: 'ACTIVE' });
        startOfferTimer(offer);
        console.log(`▶️  Oferta activada automáticamente: ${offer.name} (${offer.id})`);
      }

    } catch (error) {
      console.error('❌ Error en scheduler:', error.message);
    }
  }, 30000); // Cada 30 segundos

  console.log('✅ Scheduler iniciado (revisión cada 30s)');
};

module.exports = { startScheduler };