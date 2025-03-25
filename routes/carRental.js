const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { CarRental } = require("../models");
const { uploadCarImages } = require("../utils/fileUpload");
const { Op, fn, col } = require("sequelize");
const path = require("path");

// POST route to add a new car rental with image uploads
router.post("/", (req, res) => {
  uploadCarImages(req, res, async (err) => {
    if (err) {
      console.error("Error uploading images:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading images",
      });
    }

    try {
      const {
        title,
        carType,
        price,
        priceUnit,
        seating,
        ac,
        transmission,
        fuel,
        description,
        features,
        specifications,
        providerName,
        providerEmail,
        providerPhone,
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !carType ||
        !price ||
        !seating ||
        !transmission ||
        !fuel ||
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
        return `/uploads/cars/${file.filename}`;
      });

      // Parse features and specifications if they are strings
      let parsedFeatures = features;
      if (typeof features === "string") {
        try {
          parsedFeatures = JSON.parse(features);
        } catch (e) {
          parsedFeatures = features.split(",").map((item) => item.trim());
        }
      }

      let parsedSpecifications = specifications;
      if (typeof specifications === "string") {
        try {
          parsedSpecifications = JSON.parse(specifications);
        } catch (e) {
          parsedSpecifications = {};
        }
      }

      // Save to database
      const carRental = await CarRental.create({
        title,
        carType,
        price,
        priceUnit: priceUnit || "per day",
        seating,
        ac: ac === "true" || ac === true,
        transmission,
        fuel,
        description,
        features: parsedFeatures,
        specifications: parsedSpecifications,
        images: imageUrls,
        providerName,
        providerEmail,
        providerPhone,
      });

      // Prepare email content
      const mailOptions = {
        subject: `New Car Rental Added: ${title}`,
        html: `
          <h2>New Car Rental Added</h2>
          <p><strong>Car Model:</strong> ${title}</p>
          <p><strong>Car Type:</strong> ${carType}</p>
          <p><strong>Price:</strong> ₹${price} ${priceUnit || "per day"}</p>
          <hr>
          <h3>Provider Information:</h3>
          <p><strong>Name:</strong> ${providerName}</p>
          <p><strong>Email:</strong> ${providerEmail}</p>
          <p><strong>Phone:</strong> ${providerPhone}</p>
          <hr>
          <p><em>This car rental was added through the Add Car Rental page on the RPS Tours website.</em></p>
        `,
      };

      // Send email to admin
      await sendEmail(mailOptions);

      // Send confirmation email to provider
      const confirmationMailOptions = {
        to: providerEmail,
        subject: `Car Rental Listing Confirmation - RPS Tours`,
        html: `
          <h2>Thank You for Adding Your Car Rental</h2>
          <p>Dear ${providerName},</p>
          <p>Your car rental listing for ${title} has been successfully added to our platform. Our team will review the details and make it available for booking soon.</p>
          <p>Listing details:</p>
          <ul>
            <li><strong>Car Model:</strong> ${title}</li>
            <li><strong>Car Type:</strong> ${carType}</li>
            <li><strong>Price:</strong> ₹${price} ${priceUnit || "per day"}</li>
          </ul>
          <p>If you need to make any changes to your listing, please contact us.</p>
          <p>Best Regards,<br>RPS Tours Team</p>
        `,
      };

      await sendEmail(confirmationMailOptions);

      res.status(201).json({
        success: true,
        message: "Your car rental has been added successfully!",
        data: carRental,
      });
    } catch (error) {
      console.error("Error adding car rental:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add car rental. Please try again later.",
      });
    }
  });
});

// GET route to retrieve all car rentals
router.get("/", async (req, res) => {
  try {
    const carRentals = await CarRental.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: carRentals,
    });
  } catch (error) {
    console.error("Error fetching car rentals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car rentals",
    });
  }
});

// GET route to retrieve a specific car rental by ID
router.get("/:id", async (req, res) => {
  try {
    const carRental = await CarRental.findByPk(req.params.id);

    if (!carRental) {
      return res.status(404).json({
        success: false,
        message: "Car rental not found",
      });
    }

    res.status(200).json({
      success: true,
      data: carRental,
    });
  } catch (error) {
    console.error("Error fetching car rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car rental",
    });
  }
});

// PUT route to update a car rental
router.put("/:id", (req, res) => {
  uploadCarImages(req, res, async (err) => {
    if (err) {
      console.error("Error uploading images:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Error uploading images",
      });
    }

    try {
      const carRental = await CarRental.findByPk(req.params.id);

      if (!carRental) {
        return res.status(404).json({
          success: false,
          message: "Car rental not found",
        });
      }

      const {
        title,
        carType,
        price,
        priceUnit,
        seating,
        ac,
        transmission,
        fuel,
        description,
        features,
        specifications,
        providerName,
        providerEmail,
        providerPhone,
        existingImages,
      } = req.body;

      // Parse features and specifications if they are strings
      let parsedFeatures = features;
      if (typeof features === "string") {
        try {
          parsedFeatures = JSON.parse(features);
        } catch (e) {
          parsedFeatures = features.split(",").map((item) => item.trim());
        }
      }

      let parsedSpecifications = specifications;
      if (typeof specifications === "string") {
        try {
          parsedSpecifications = JSON.parse(specifications);
        } catch (e) {
          parsedSpecifications = {};
        }
      }

      // Handle images
      let imageUrls = [];

      // Keep existing images if specified
      if (existingImages) {
        if (typeof existingImages === "string") {
          imageUrls = JSON.parse(existingImages);
        } else {
          imageUrls = existingImages;
        }
      }

      // Add new uploaded images
      if (req.files && req.files.length > 0) {
        const newImageUrls = req.files.map(
          (file) => `/uploads/cars/${file.filename}`
        );
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      // Update car rental
      await carRental.update({
        title: title || carRental.title,
        carType: carType || carRental.carType,
        price: price || carRental.price,
        priceUnit: priceUnit || carRental.priceUnit,
        seating: seating || carRental.seating,
        ac: ac !== undefined ? ac === "true" || ac === true : carRental.ac,
        transmission: transmission || carRental.transmission,
        fuel: fuel || carRental.fuel,
        description: description || carRental.description,
        features: parsedFeatures || carRental.features,
        specifications: parsedSpecifications || carRental.specifications,
        images: imageUrls.length > 0 ? imageUrls : carRental.images,
        providerName: providerName || carRental.providerName,
        providerEmail: providerEmail || carRental.providerEmail,
        providerPhone: providerPhone || carRental.providerPhone,
      });

      res.status(200).json({
        success: true,
        message: "Car rental updated successfully",
        data: carRental,
      });
    } catch (error) {
      console.error("Error updating car rental:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update car rental. Please try again later.",
      });
    }
  });
});

// DELETE route to remove a car rental
router.delete("/:id", async (req, res) => {
  try {
    const carRental = await CarRental.findByPk(req.params.id);

    if (!carRental) {
      return res.status(404).json({
        success: false,
        message: "Car rental not found",
      });
    }

    await carRental.destroy();

    res.status(200).json({
      success: true,
      message: "Car rental deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car rental:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete car rental. Please try again later.",
    });
  }
});

module.exports = router;
