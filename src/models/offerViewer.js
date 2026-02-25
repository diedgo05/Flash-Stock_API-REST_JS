const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OfferViewer = sequelize.define('OfferViewer', {
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
  // Socket ID de la sesión (no del usuario, para permitir visitantes anónimos)
  socket_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true // Un socket solo puede estar viendo una oferta a la vez
  },
  connected_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'offer_viewers',
  timestamps: false // Esta tabla es temporal, no necesita created_at/updated_at
});

module.exports = OfferViewer;