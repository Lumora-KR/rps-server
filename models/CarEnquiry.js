const mongoose = require("mongoose");

const CarEnquirySchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarRental",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please provide your phone number"],
      trim: true,
    },
    pickupDate: {
      type: Date,
      required: [true, "Please provide pickup date"],
    },
    returnDate: {
      type: Date,
      required: [true, "Please provide return date"],
    },
    pickupLocation: {
      type: String,
      required: [true, "Please provide pickup location"],
    },
    returnLocation: {
      type: String,
      required: [true, "Please provide return location"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CarEnquiry", CarEnquirySchema);
