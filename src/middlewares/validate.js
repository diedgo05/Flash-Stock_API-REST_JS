const { validationResult } = require('express-validator');

// Ejecuta las validaciones y responde si hay errores
// Se usa después de los arrays de validación en las rutas
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos en la solicitud',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = { validate };