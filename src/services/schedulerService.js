const { Op } = require('sequelize');
const { Offer } = require('../models');
const { startOfferTimer } = require('./offerService');

const startScheduler = () => {
  // Cada 30 segundos revisa si hay ofertas SCHEDULED que ya deben activarse
  setInterval(async () => {
    const now = new Date();

    const offersToActivate = await Offer.findAll({
      where: {
        status: 'SCHEDULED',
        start_time: { [Op.lte]: now } // start_time <= ahora
      }
    });

    for (const offer of offersToActivate) {
      await offer.update({ status: 'ACTIVE' });
      startOfferTimer(offer);
      console.log(`▶️ Oferta activada automáticamente: ${offer.id}`);
    }
  }, 30000);

  console.log('✅ Scheduler iniciado');
};

module.exports = { startScheduler };