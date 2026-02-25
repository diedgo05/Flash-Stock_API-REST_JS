const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  offer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  price_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
    }
  },
  ticket_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true // Cada ticket es único en todo el sistema
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'REDEEMED', 'EXPIRED'),
    defaultValue: 'PENDING'
  },
  purchased_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'purchases'
});

module.exports = Purchase;