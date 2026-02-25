const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Offer = sequelize.define('Offer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    store_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id'
        }
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'El nombre del producto no puede estar vacío' }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      initial_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0.01], msg: 'El precio inicial debe ser mayor a 0' }
        }
      },
      min_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: [0.01], msg: 'El precio mínimo debe ser mayor a 0' },
          // Validación custom: min_price no puede ser mayor que initial_price
          isLessThanInitial(value) {
            if (parseFloat(value) >= parseFloat(this.initial_price)) {
              throw new Error('El precio mínimo debe ser menor al precio inicial');
            }
          }
        }
      },
      current_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        // Se inicializa igual al initial_price, el servidor lo actualiza
        validate: {
          min: { args: [0.01], msg: 'El precio actual debe ser mayor a 0' }
        }
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [1], msg: 'El stock debe ser al menos 1' }
        }
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          // end_time debe ser después de start_time
          isAfterStart(value) {
            if (new Date(value) <= new Date(this.start_time)) {
              throw new Error('La hora de cierre debe ser posterior a la hora de inicio');
            }
          }
        }
      },
      status: {
        type: DataTypes.ENUM('SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'SCHEDULED'
      }
    }, {
      tableName: 'offers',
      hooks: {
        // Al crear una oferta, current_price = initial_price
        beforeCreate: (offer) => {
          offer.current_price = offer.initial_price;
        }
      }
    });

    module.exports = Offer;