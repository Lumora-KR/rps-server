// config/database.js
const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

// Database configuration
const DB_NAME = process.env.DB_NAME || "rps";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 3306;

// Initialize database if it doesn't exist
const initializeDatabase = async () => {
  try {
    // Create a connection to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME};`);
    console.log(`Database '${DB_NAME}' checked/created successfully`);

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

// Initialize database and test connection
const setupDatabase = async () => {
  try {
    await initializeDatabase();
    await testConnection();
    return true;
  } catch (error) {
    console.error("Database setup failed:", error);
    return false;
  }
};

module.exports = {
  initializeDatabase,
  testConnection,
  sequelize,
  setupDatabase,
};
