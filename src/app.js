require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const { connectDB } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');




// Rutas
const userAuthRoutes = require('./routes/userAuthRoutes');
const storeAuthRoutes = require('./routes/storeAuthRoutes');

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Rutas de la API 
app.use('/api/auth/users', userAuthRoutes);
app.use('/api/auth/stores', storeAuthRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // 1. Conectar a la base de datos
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
    // console.log(`📡 WebSocket listo en ws://localhost:${PORT}`);
    // console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  });
};

startServer().catch((error) => {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  });