// routes/tourPackageDetailForm.js
const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { TourPackageDetail } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../config/database");

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      packageId,
      packageName,
      selectedDate,
      adults,
      children,
      message,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !packageId) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Save to database
    const tourPackageDetail = await TourPackageDetail.create({
      name,
      email,
      phone,
      packageId,
      packageName,
      selectedDate,
      adults: adults || 1,
      children: children || 0,
      message,
    });

    // Prepare email content
    const mailOptions = {
      subject: `Tour Package Booking: ${packageName || packageId}`,
      html: `
        <h2>New Tour Package Booking Request</h2>
        <p><strong>Package Name:</strong> ${packageName || "Not specified"}</p>
        <p><strong>Package ID:</strong> ${packageId}</p>
        <hr>
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr>
        <h3>Booking Details:</h3>
        <p><strong>Travel Date:</strong> ${
          formatDate(selectedDate) || "Not specified"
        }</p>
        <p><strong>Number of Adults:</strong> ${adults || "1"}</p>
        <p><strong>Number of Children:</strong> ${children || "0"}</p>
        <h3>Special Requirements:</h3>
        <p>${message || "No special requirements provided"}</p>
        <hr>
        <p><em>This booking request was submitted from the specific Tour Package detail page (ID: ${packageId}) on the RPS Tours website.</em></p>
      `,
    };

    // Send email
    await sendEmail(mailOptions);

    // Send confirmation email to customer
    const confirmationMailOptions = {
      to: email,
      subject: `Tour Package Booking Confirmation - RPS Tours`,
      html: `
        <h2>Thank You for Your Tour Package Booking Request</h2>
        <p>Dear ${name},</p>
        <p>We have received your tour package booking request for ${
          packageName || packageId
        } and our team will get back to you shortly to confirm your reservation.</p>
        <p>Your booking details:</p>
        <ul>
          <li><strong>Travel Date:</strong> ${
            formatDate(selectedDate) || "Not specified"
          }</li>
          <li><strong>Number of Adults:</strong> ${adults || "1"}</li>
          <li><strong>Number of Children:</strong> ${children || "0"}</li>
        </ul>
        <p>If you have any questions, please feel free to contact us.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    await sendEmail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Your tour package booking request has been sent successfully. We will contact you soon!",
      data: tourPackageDetail,
    });
  } catch (error) {
    console.error("Tour package detail form submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your booking request. Please try again later.",
    });
  }
});

// GET route for retrieving all tour package details
router.get("/", async (req, res) => {
  console.log("GET /api/tour-packages route hit");
  try {
    const tourPackageDetails = await TourPackageDetail.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: tourPackageDetails,
    });
  } catch (error) {
    console.error("Error fetching tour package details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tour package details",
    });
  }
});

// GET route for chart data (daily tour package bookings)
router.get("/chart", async (req, res) => {
  try {
    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const tourPackageDetails = await TourPackageDetail.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
    });

    // Format data for Chart.js
    const labels = [];
    const data = [];

    // Create a map of dates to counts
    const dateMap = new Map();
    tourPackageDetails.forEach((item) => {
      dateMap.set(
        item.getDataValue("date"),
        parseInt(item.getDataValue("count"))
      );
    });

    // Fill in all dates in the range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      labels.push(dateStr);
      data.push(dateMap.get(dateStr) || 0);
    }

    res.status(200).json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label: "Tour Package Bookings",
            data,
            backgroundColor: "rgba(255, 152, 0, 0.5)",
            borderColor: "rgba(255, 152, 0, 1)",
            borderWidth: 1,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
    });
  }
});

// Format date for email
const formatDate = (dateString) => {
  if (!dateString) return "Not specified";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

module.exports = router;
