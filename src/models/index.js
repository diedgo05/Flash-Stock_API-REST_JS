const User = require('./User');
const Store = require('./Store');
const Category = require('./category');
const Offer = require('./offer');
const Purchase = require('./purchase');
const Notification = require('./notification');
const OfferViewer = require('./offerViewer');

// User → Store (un usuario puede tener una tienda)
User.hasOne(Store, { foreignKey: 'owner_id', as: 'store' });
Store.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Store → Offer (una tienda tiene muchas ofertas)
Store.hasMany(Offer, { foreignKey: 'store_id', as: 'offers' });
Offer.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// Category → Offer (una categoría tiene muchas ofertas)
Category.hasMany(Offer, { foreignKey: 'category_id', as: 'offers' });
Offer.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User ↔ Offer → Purchase (un usuario compra muchas ofertas)
User.hasMany(Purchase, { foreignKey: 'user_id', as: 'purchases' });
Purchase.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Offer.hasMany(Purchase, { foreignKey: 'offer_id', as: 'purchases' });
Purchase.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });

// User → Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Offer → Notification
Offer.hasMany(Notification, { foreignKey: 'offer_id', as: 'notifications' });
Notification.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });

// Offer → OfferViewer (una oferta tiene muchos viewers en tiempo real)
Offer.hasMany(OfferViewer, { foreignKey: 'offer_id', as: 'viewers' });
OfferViewer.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });

module.exports = {
  User,
  Store,
  Category,
  Offer,
  Purchase,
  Notification,
  OfferViewer
};