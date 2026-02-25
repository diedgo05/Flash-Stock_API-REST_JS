const jwt = require('jsonwebtoken');
const { User, Store } = require('../models');

const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Token no proporcionado. Inicia sesión para continuar"
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'user') {
            return res.status(403).json({
                success: false,
                message: "Acceso denegado. Esta ruta es solo para usuarios"
            });
        }

        const user = await User.findOne({
            where: { id: decoded.id, is_active: true }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no encontrado o cuenta desactivada"
            });
        }

        res.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Token expirado. Inicia sesión nuevamente.' });
        }
        return res.status(401).json({ success: false, message: 'Token inválido.' });
      }
};

const authStore = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado.'
        });
      }
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      if (decoded.role !== 'store') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Esta ruta es solo para tiendas.'
        });
      }
  
      const store = await Store.findOne({
        where: { id: decoded.id, is_active: true }
      });
  
      if (!store) {
        return res.status(401).json({
          success: false,
          message: 'Tienda no encontrada o cuenta desactivada.'
        });
      }
  
      req.store = store; // Disponible en el controlador como req.store
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expirado.' });
      }
      return res.status(401).json({ success: false, message: 'Token inválido.' });
    }
  };
  
  module.exports = { authUser, authStore };