require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const { connectDB } = require('./config/database');
const { initSocket } = require('./config/socket');
const { registerSocketHandlers } = require('./sockets');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { reactivateActiveOffers } = require('./services/offerService');
const { startScheduler } = require('./services/schedulerService');


// ── Rutas ─────────────────────────────────────────────────────────────────────
const userAuthRoutes = require('./routes/userAuthRoutes');
const storeAuthRoutes = require('./routes/storeAuthRoutes');
const offerRoutes = require('./routes/offerRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// ── Inicialización ────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app); // Express y Socket.IO comparten el mismo servidor

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes subidas estáticamente
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth/users', userAuthRoutes);
app.use('/api/auth/stores', storeAuthRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo de errores (siempre al final) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Arranque del servidor ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // 1. Conectar a la base de datos
  await connectDB();

  // 2. Inicializar Socket.IO (debe ser DESPUÉS de connectDB para reactivar timers)
  const io = initSocket(httpServer);
  registerSocketHandlers(io);

  // 3. Arrancar el servidor HTTP
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 WebSocket listo en ws://localhost:${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  });

  // 4. Reactivar timers de ofertas activas (por si el servidor se reinició)
  await reactivateActiveOffers();
  startScheduler();
};

startServer().catch((error) => {
  console.error('❌ Error fatal al iniciar el servidor:', error);
  process.exit(1);
});