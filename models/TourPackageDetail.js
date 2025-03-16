// models/TourPackageDetail.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TourPackageDetail = sequelize.define(
  "TourPackageDetail",
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
    packageId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    selectedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    adults: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    children: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    tableName: "tour_package_details",
    timestamps: true,
  }
);

module.exports = TourPackageDetail;
