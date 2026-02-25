const jwt = require('jsonwebtoken');
const { User } = require('../models');

//  Generar token JWT 
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/users/register 
const registerUser = async (req, res, next) => {
  try {
    const { name, last_name, email, password, phone } = req.body;

    const user = await User.create({ name, last_name, email, password, phone });
    const token = generateToken(user.id, 'user');

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: user.toSafeJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/users/login 
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, is_active: true } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos'
      });
    }

    const token = generateToken(user.id, 'user');

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: user.toSafeJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

//  GET /api/auth/users/me 
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toSafeJSON() }
  });
};

module.exports = { registerUser, loginUser, getMe };