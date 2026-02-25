// Manejador de errores centralizados

const errorHandler = async (err, req, res, next) => {
  console.error(`Error: ${err.message}`);

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Error de validación de Sequelize (campo inválido)
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: messages,
    });
  }

  // Error de unicidad (email duplicado, etc.)
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors[0]?.path || "campo";
    return res.status(409).json({
      success: false,
      message: `Ya existe un registro con ese ${field}.`,
    });
  }

  // Error de FK inexistente
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida. El recurso relacionado no existe.'
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido.' });
  }

  // Error genérico del servidor
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Para rutas no encontradas (404)
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};


module.exports = { errorHandler, notFoundHandler };
