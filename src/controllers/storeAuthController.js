const jwt = require('jsonwebtoken');
const { Store } = require('../models');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

//  POST /api/auth/stores/register 
const registerStore = async (req, res, next) => {
  try {
    const { store_name, email, password, phone, address, city } = req.body;

    const store = await Store.create({
      store_name,
      email,
      password,
      phone,
      address,
      city,
      // Logo se sube por separado con PATCH /api/stores/me/logo
    });

    const token = generateToken(store.id, 'store');

    res.status(201).json({
      success: true,
      message: 'Tienda registrada exitosamente',
      data: {
        store: store.toSafeJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

//  POST /api/auth/stores/login 
const loginStore = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const store = await Store.findOne({ where: { email, is_active: true } });

    if (!store || !(await store.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos'
      });
    }

    const token = generateToken(store.id, 'store');

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        store: store.toSafeJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

//  GET /api/auth/stores/me 
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { store: req.store.toSafeJSON() }
  });
};

//  PATCH /api/auth/stores/me 
const updateStore = async (req, res, next) => {
  try {
    const { store_name, phone, address, city } = req.body;

    await req.store.update({ store_name, phone, address, city });

    res.json({
      success: true,
      message: 'Perfil actualizado',
      data: { store: req.store.toSafeJSON() }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerStore, loginStore, getMe, updateStore };