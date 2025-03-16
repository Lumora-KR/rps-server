// routes/hotel.js
const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { Hotel } = require("../models");
const { uploadHotelImages } = require("../utils/fileUpload");
const { Op, fn, col } = require("sequelize");
const path = require("path");

// POST route to add a new hotel with image uploads
router.post("/", (req, res) => {
  uploadHotelImages(req, res, async (err) => {
    if (err) {
      console.error("Error uploading images:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading images",
      });
    }

    try {
      const {
        name,
        location,
        price,
        rating,
        type,
        description,
        amenities,
        providerName,
        providerEmail,
        providerPhone,
      } = req.body;

      // Validate required fields
      if (
        !name ||
        !location ||
        !price ||
        !type ||
        !providerName ||
        !providerEmail ||
        !providerPhone
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required fields",
        });
      }

      // Process uploaded images
      const imageUrls = req.files.map((file) => {
        // Create URL path for the image
        return `/uploads/hotels/${file.filename}`;
      });

      // Parse amenities if it's a string
      let parsedAmenities = amenities;
      if (typeof amenities === "string") {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch (e) {
          parsedAmenities = amenities.split(",").map((item) => item.trim());
        }
      }

      // Save to database
      const hotel = await Hotel.create({
        name,
        location,
        price,
        rating: rating || 0,
        type,
        description,
        images: imageUrls,
        amenities: parsedAmenities,
        providerName,
        providerEmail,
        providerPhone,
      });

      // Prepare email content
      const mailOptions = {
        subject: `New Hotel Added: ${name}`,
        html: `
          <h2>New Hotel Added</h2>
          <p><strong>Hotel Name:</strong> ${name}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Price:</strong> ₹${price} per night</p>
          <p><strong>Type:</strong> ${type}</p>
          <hr>
          <h3>Provider Information:</h3>
          <p><strong>Name:</strong> ${providerName}</p>
          <p><strong>Email:</strong> ${providerEmail}</p>
          <p><strong>Phone:</strong> ${providerPhone}</p>
          <hr>
          <p><em>This hotel was added through the Add Hotel page on the RPS Tours website.</em></p>
        `,
      };

      // Send email to admin
      await sendEmail(mailOptions);

      // Send confirmation email to provider
      const confirmationMailOptions = {
        to: providerEmail,
        subject: `Hotel Listing Confirmation - RPS Tours`,
        html: `
          <h2>Thank You for Adding Your Hotel</h2>
          <p>Dear ${providerName},</p>
          <p>Your hotel listing for ${name} has been successfully added to our platform. Our team will review the details and make it available for booking soon.</p>
          <p>Listing details:</p>
          <ul>
            <li><strong>Hotel Name:</strong> ${name}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Price:</strong> ₹${price} per night</li>
            <li><strong>Type:</strong> ${type}</li>
          </ul>
          <p>If you need to make any changes to your listing, please contact us.</p>
          <p>Best Regards,<br>RPS Tours Team</p>
        `,
      };

      await sendEmail(confirmationMailOptions);

      res.status(201).json({
        success: true,
        message: "Your hotel has been added successfully!",
        data: hotel,
      });
    } catch (error) {
      console.error("Error adding hotel:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add hotel. Please try again later.",
      });
    }
  });
});

// GET route to retrieve all hotels
router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
    });
  }
});

// GET route to retrieve a specific hotel by ID
router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel",
    });
  }
});

module.exports = router;
