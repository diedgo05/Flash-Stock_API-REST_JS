const { handleOfferSocket } = require('./offerSocket');

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    handleOfferSocket(io, socket);

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });
};

module.exports = { registerSocketHandlers };