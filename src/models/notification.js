const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  offer_id: {
    type: DataTypes.UUID,
    allowNull: true, // Puede haber notificaciones sin oferta específica
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('PRICE_DROP', 'STOCK_CRITICAL', 'OFFER_STARTED', 'SOLD_OUT'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'notifications',
  updatedAt: false // Las notificaciones no se editan, solo se marcan como leídas
});

module.exports = Notification;