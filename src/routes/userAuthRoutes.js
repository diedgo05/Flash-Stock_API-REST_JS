const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authUser } = require('../middlewares/auth');
const { registerUser, loginUser, getMe } = require('../controllers/userAuthController');

const router = Router();

// POST /api/auth/users/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('last_name').trim().notEmpty().withMessage('El apellido es requerido'),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Contraseña de mínimo 6 caracteres'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  validate
], registerUser);

// POST /api/auth/users/login
router.post('/login', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  validate
], loginUser);

// GET /api/auth/users/me  (protegida)
router.get('/me', authUser, getMe);

module.exports = router;