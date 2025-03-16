// models/Hotel.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Hotel = sequelize.define("Hotel", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
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
  amenities: {
    type: DataTypes.TEXT,
    get() {
      return this.getDataValue("amenities")
        ? JSON.parse(this.getDataValue("amenities"))
        : [];
    },
    set(val) {
      this.setDataValue("amenities", JSON.stringify(val));
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

module.exports = Hotel;
