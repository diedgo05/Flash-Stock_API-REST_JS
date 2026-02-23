require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10, // Máximo de conexiones simultáneas
      min: 0,
      acquire: 30000, // Tiempo máximo para obtener una conexión (ms)
      idle: 10000, // Tiempo antes de liberar una conexión inactiva (ms)
    },
    define: {
      // Todas las tablas usan snake_case y timestamps automáticos
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a PostgreSQL exitosa");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("Modelos sincronizados con la DB");
    }
  } catch (error) {
    console.log("Error conectando a PostgreSQL:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
