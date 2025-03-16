// models/HotelEnquiry.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const HotelEnquiry = sequelize.define("HotelEnquiry", {
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hotelName: {
    type: DataTypes.STRING,
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
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  guests: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  rooms: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  message: {
    type: DataTypes.TEXT,
  },
});

module.exports = HotelEnquiry;
