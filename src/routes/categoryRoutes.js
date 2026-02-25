const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { getCategories, createCategory } = require('../controllers/categoryController');

const router = Router();

// GET /api/categories
router.get('/', getCategories);

// POST /api/categories (sin protección en MVP, agregar auth admin en el futuro)
router.post('/', [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  validate
], createCategory);

module.exports = router;