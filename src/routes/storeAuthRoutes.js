const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authStore } = require('../middlewares/auth');
const { registerStore, loginStore, getMe, updateStore } = require('../controllers/storeAuthController');

const router = Router();

// POST /api/auth/stores/register
router.post('/register', [
  body('store_name').trim().notEmpty().withMessage('El nombre de la tienda es requerido'),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Contraseña de mínimo 6 caracteres'),
  body('city').trim().notEmpty().withMessage('La ciudad es requerida'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  validate
], registerStore);

// POST /api/auth/stores/login
router.post('/login', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  validate
], loginStore);

// GET /api/auth/stores/me  (protegida)
router.get('/me', authStore, getMe);

// PATCH /api/auth/stores/me  (protegida)
router.patch('/me', authStore, [
  body('store_name').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  validate
], updateStore);

module.exports = router;