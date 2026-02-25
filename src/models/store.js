  const { DataTypes } = require('sequelize');
  const { sequelize } = require('../config/database');
  const bcrypt = require('bcryptjs');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: true, // null si la tienda se registra de forma independiente
    references: {
      model: 'users',
      key: 'id'
    }
  },
  store_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre de la tienda no puede estar vacío' }
    }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: { msg: 'Este correo ya está registrado' },
    validate: {
      isEmail: { msg: 'Formato de correo inválido' }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La ciudad es requerida para mostrar ofertas locales' }
    }
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Admin verifica manualmente en el futuro
  }
}, {
  tableName: 'stores',
  hooks: {
    beforeCreate: async (store) => {
      if (store.password) {
        store.password = await bcrypt.hash(store.password, 12);
      }
    },
    beforeUpdate: async (store) => {
      if (store.changed('password')) {
        store.password = await bcrypt.hash(store.password, 12);
      }
    }
  }
});

Store.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

Store.prototype.toSafeJSON = function () {
  const { password, ...safeData } = this.toJSON();
  return safeData;
};

module.exports = Store;