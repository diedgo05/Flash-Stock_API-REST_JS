const { Router } = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { validate } = require('../middlewares/validate');
const { authUser, authStore } = require('../middlewares/auth');
const {
  getActiveOffers,
  getOfferById,
  createOffer,
  getStoreOffers,
  cancelOffer,
  getOfferPurchases
} = require('../controllers/offerController');

// ── Configuración de Multer para fotos de productos ──────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `offer-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
    }
  }
});

const router = Router();

// ── Rutas Públicas (cualquiera puede verlas) ──────────────────────────────────

// GET /api/offers?city=Tuxtla&category_id=xxx&page=1
router.get('/', getActiveOffers);

// ── Rutas de Tienda (requieren authStore) ─────────────────────────────────────

// GET /api/offers/store/mine
router.get('/store/mine', authStore, getStoreOffers);

// Esta no requiere auth
// GET /api/offers/:id
router.get('/:id', getOfferById);


// POST /api/offers  (con foto opcional)
router.post('/', authStore, upload.single('photo'), [
  body('name').trim().notEmpty().withMessage('El nombre del producto es requerido'),
  body('category_id').isUUID().withMessage('Categoría inválida'),
  body('initial_price').isFloat({ min: 0.01 }).withMessage('Precio inicial inválido'),
  body('min_price').isFloat({ min: 0.01 }).withMessage('Precio mínimo inválido'),
  body('stock').isInt({ min: 1 }).withMessage('El stock debe ser al menos 1'),
  body('start_time').isISO8601().withMessage('Fecha de inicio inválida'),
  body('end_time').isISO8601().withMessage('Fecha de cierre inválida'),
  validate
], createOffer);

// PATCH /api/offers/:id/cancel
router.patch('/:id/cancel', authStore, cancelOffer);

// GET /api/offers/:id/purchases
router.get('/:id/purchases', authStore, getOfferPurchases);

module.exports = router;