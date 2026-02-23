require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const { connectDB } = require('./config/database');




const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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