const { Category } = require('../models');

// ── GET /api/categories ───────────────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/categories ──────────────────────────────────────────────────────
// (En el futuro esto será solo para admin, por ahora queda libre)
const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory };