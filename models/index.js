// models/index.js
const { sequelize, setupDatabase } = require("../config/database");
const CarRentalDetail = require("./CarRentalDetail");
const TourPackageDetail = require("./TourPackageDetail");
const HomeEnquiry = require("./HomeEnquiry");
const ContactForm = require("./ContactForm");
const User = require("./User");
const CarRental = require("./CarRental");
const Hotel = require("./Hotel");
const HotelEnquiry = require("./HotelEnquiry");

// Initialize models
const initializeModels = async () => {
  try {
    // Setup database (create if not exists and test connection)
    const dbSetup = await setupDatabase();
    if (!dbSetup) {
      throw new Error("Database setup failed");
    }

    // Sync all models with database
    await sequelize.sync();
    console.log("All models were synchronized successfully.");

    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { username: "rpstours" } });
    if (!adminExists) {
      await User.create({
        username: "rpstours",
        password: "rpstours123",
      });
      console.log("Default admin user created.");
    }
  } catch (error) {
    console.error("Error initializing models:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  HomeEnquiry,
  CarRentalDetail,
  TourPackageDetail,
  ContactForm,
  User,
  CarRental,
  Hotel,
  HotelEnquiry,
  initializeModels,
};
