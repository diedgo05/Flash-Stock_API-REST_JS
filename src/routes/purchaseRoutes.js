const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authUser, authStore } = require('../middlewares/auth');
const { createPurchase, getUserPurchases, redeemTicket } = require('../controllers/purchaseController');

const router = Router();

// POST /api/purchases  (usuario compra)
router.post('/', authUser, [
  body('offer_id').isUUID().withMessage('ID de oferta inválido'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
  validate
], createPurchase);

// GET /api/purchases/my-history  (historial del usuario)
router.get('/my-history', authUser, getUserPurchases);

// PATCH /api/purchases/:ticketCode/redeem  (tienda canjea ticket)
router.patch('/:ticketCode/redeem', authStore, redeemTicket);

module.exports = router;