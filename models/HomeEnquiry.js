const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const HomeEnquiry = sequelize.define(
  "HomeEnquiry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    formType: {
      type: DataTypes.ENUM("cars", "tourPackages", "hotels"),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
      defaultValue: "pending",
    },
    // Car specific fields
    fromLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pickupDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    carType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Tour package specific fields
    packageType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    travelDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    travelers: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 1,
    },
    // Hotel specific fields
    destination: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
  },
  {
    tableName: "home_enquiries",
    timestamps: true,
  }
);

module.exports = HomeEnquiry;
