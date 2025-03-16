// models/CarRentalDetail.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CarRentalDetail = sequelize.define(
  "CarRentalDetail",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    carId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    carName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pickupDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    returnLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "car_rental_details",
    timestamps: true,
  }
);

module.exports = CarRentalDetail;
