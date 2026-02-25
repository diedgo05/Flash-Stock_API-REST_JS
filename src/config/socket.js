const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // En producción: restringe a tu dominio
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  console.log('✅ Socket.IO inicializado');
  return io;
};

// Getter para usar io en cualquier parte del proyecto sin circular deps
const getIO = () => {
  if (!io) throw new Error('Socket.IO no ha sido inicializado aún');
  return io;
};

module.exports = { initSocket, getIO };