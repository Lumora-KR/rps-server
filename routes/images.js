// routes/images.js (New route for serving images)
const express = require("express");
const router = express.Router();
const { Image } = require("../models");
const path = require("path");
const fs = require("fs");

// GET route to serve an image by ID
router.get("/:id", async (req, res) => {
  try {
    const image = await Image.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Check if file exists
    if (!fs.existsSync(image.path)) {
      return res.status(404).json({
        success: false,
        message: "Image file not found",
      });
    }

    // Set content type based on mimetype
    res.setHeader("Content-Type", image.mimetype);

    // Stream the file
    const fileStream = fs.createReadStream(image.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to serve image",
    });
  }
});

module.exports = router;
