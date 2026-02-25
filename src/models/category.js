const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: { msg: 'Esta categoría ya existe' },
    validate: {
      notEmpty: { msg: 'El nombre de la categoría no puede estar vacío' }
    }
  }
}, {
  tableName: 'categories'
});

module.exports = Category;