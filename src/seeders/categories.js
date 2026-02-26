// src/seeders/categories.js
// Ejecutar con: node src/seeders/categories.js

require('dotenv').config();
const { Category } = require('../models');
const { connectDB } = require('../config/database');

const categories = [
  { name: 'Panadería y Repostería' },
  { name: 'Comida Preparada' },
  { name: 'Flores y Plantas' },
  { name: 'Frutas y Verduras' },
  { name: 'Lácteos' },
  { name: 'Carnes y Embutidos' },
  { name: 'Mariscos' },
  { name: 'Bebidas' },
  { name: 'Postres y Helados' },
  { name: 'Otros' }
];

const seed = async () => {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const cat of categories) {
    const [, wasCreated] = await Category.findOrCreate({
      where: { name: cat.name },
      defaults: cat
    });
    wasCreated ? created++ : skipped++;
  }

  console.log(`✅ Seed completado: ${created} creadas, ${skipped} ya existían`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});