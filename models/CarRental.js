// models/CarRental.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CarRental = sequelize.define("CarRental", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  carType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  priceUnit: {
    type: DataTypes.STRING,
    defaultValue: "per day",
  },
  seating: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ac: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  transmission: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fuel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  features: {
    type: DataTypes.TEXT,
    get() {
      return this.getDataValue("features")
        ? JSON.parse(this.getDataValue("features"))
        : [];
    },
    set(val) {
      this.setDataValue("features", JSON.stringify(val));
    },
  },
  specifications: {
    type: DataTypes.TEXT,
    get() {
      return this.getDataValue("specifications")
        ? JSON.parse(this.getDataValue("specifications"))
        : {};
    },
    set(val) {
      this.setDataValue("specifications", JSON.stringify(val));
    },
  },
  images: {
    type: DataTypes.TEXT,
    get() {
      return this.getDataValue("images")
        ? JSON.parse(this.getDataValue("images"))
        : [];
    },
    set(val) {
      this.setDataValue("images", JSON.stringify(val));
    },
  },
  providerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  providerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  providerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = CarRental;
