const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { CarRentalDetail } = require("../models");
const { Op, fn, col } = require("sequelize"); // Import Sequelize operators and functions

// POST route for form submission
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      carId,
      carName,
      pickupDate,
      returnDate,
      pickupLocation,
      returnLocation,
      message,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !carId || !pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Save to database
    const carRentalDetail = await CarRentalDetail.create({
      name,
      email,
      phone,
      carId,
      carName,
      pickupDate,
      returnDate,
      pickupLocation,
      returnLocation,
      message,
    });

    // Prepare email content
    const mailOptions = {
      subject: `Car Rental Booking: ${carName || carId}`,
      html: `
        <h2>New Car Rental Booking Request</h2>
        <p><strong>Car Model:</strong> ${carName || "Not specified"}</p>
        <p><strong>Car ID:</strong> ${carId}</p>
        <hr>
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr>
        <h3>Rental Details:</h3>
        <p><strong>Pickup Date:</strong> ${formatDate(pickupDate)}</p>
        <p><strong>Return Date:</strong> ${formatDate(returnDate)}</p>
        <p><strong>Pickup Location:</strong> ${
          pickupLocation || "Not specified"
        }</p>
        <p><strong>Return Location:</strong> ${
          returnLocation || "Same as pickup location"
        }</p>
        <h3>Special Requirements:</h3>
        <p>${message || "No special requirements provided"}</p>
        <hr>
        <p><em>This booking request was submitted from the specific Car Rental detail page (ID: ${carId}) on the RPS Tours website.</em></p>
      `,
    };

    // Send email
    await sendEmail(mailOptions);

    // Send confirmation email to customer
    const confirmationMailOptions = {
      to: email,
      subject: `Car Rental Booking Confirmation - RPS Tours`,
      html: `
        <h2>Thank You for Your Car Rental Booking Request</h2>
        <p>Dear ${name},</p>
        <p>We have received your car rental booking request for ${
          carName || carId
        } and our team will get back to you shortly to confirm your reservation.</p>
        <p>Your booking details:</p>
        <ul>
          <li><strong>Pickup Date:</strong> ${formatDate(pickupDate)}</li>
          <li><strong>Return Date:</strong> ${formatDate(returnDate)}</li>
          <li><strong>Pickup Location:</strong> ${
            pickupLocation || "Not specified"
          }</li>
        </ul>
        <p>If you have any questions, please feel free to contact us.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    await sendEmail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Your car rental booking request has been sent successfully. We will contact you soon!",
      data: carRentalDetail,
    });
  } catch (error) {
    console.error("Car rental detail form submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your booking request. Please try again later.",
    });
  }
});

// GET route for retrieving all car rental details
router.get("/", async (req, res) => {
  try {
    // Add pagination support
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    // Build where clause
    let whereClause = {};

    // Add status filter if provided
    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Add search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { carName: { [Op.like]: `%${search}%` } },
          { pickupLocation: { [Op.like]: `%${search}%` } },
          { returnLocation: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: carRentalDetails } =
      await CarRentalDetail.findAndCountAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: carRentalDetails,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching car rental details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car rental details",
    });
  }
});

// GET route for retrieving a specific car rental detail by ID
router.get("/:id", async (req, res) => {
  try {
    const carRentalDetail = await CarRentalDetail.findByPk(req.params.id);

    if (!carRentalDetail) {
      return res.status(404).json({
        success: false,
        message: "Car rental detail not found",
      });
    }

    res.status(200).json({
      success: true,
      data: carRentalDetail,
    });
  } catch (error) {
    console.error("Error fetching car rental detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car rental detail",
    });
  }
});

// PUT route for updating a car rental detail
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      carId,
      carName,
      pickupDate,
      returnDate,
      pickupLocation,
      returnLocation,
      message,
      status,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !carId || !pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const carRentalDetail = await CarRentalDetail.findByPk(req.params.id);

    if (!carRentalDetail) {
      return res.status(404).json({
        success: false,
        message: "Car rental detail not found",
      });
    }

    // Update the car rental detail
    await carRentalDetail.update({
      name,
      email,
      phone,
      carId,
      carName,
      pickupDate,
      returnDate,
      pickupLocation,
      returnLocation,
      message,
      status,
    });

    // If status has changed, send notification email
    if (req.body.status && req.body.status !== carRentalDetail.status) {
      const statusMailOptions = {
        to: email,
        subject: `Car Rental Booking Status Update - RPS Tours`,
        html: `
          <h2>Your Car Rental Booking Status Has Been Updated</h2>
          <p>Dear ${name},</p>
          <p>Your car rental booking request for ${
            carName || carId
          } has been updated to: <strong>${status}</strong>.</p>
          <p>Your booking details:</p>
          <ul>
            <li><strong>Pickup Date:</strong> ${formatDate(pickupDate)}</li>
            <li><strong>Return Date:</strong> ${formatDate(returnDate)}</li>
            <li><strong>Pickup Location:</strong> ${
              pickupLocation || "Not specified"
            }</li>
          </ul>
          <p>If you have any questions, please feel free to contact us.</p>
          <p>Best Regards,<br>RPS Tours Team</p>
        `,
      };

      await sendEmail(statusMailOptions);
    }

    res.status(200).json({
      success: true,
      message: "Car rental detail updated successfully",
      data: carRentalDetail,
    });
  } catch (error) {
    console.error("Error updating car rental detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update car rental detail",
    });
  }
});

// DELETE route for deleting a car rental detail
router.delete("/:id", async (req, res) => {
  try {
    const carRentalDetail = await CarRentalDetail.findByPk(req.params.id);

    if (!carRentalDetail) {
      return res.status(404).json({
        success: false,
        message: "Car rental detail not found",
      });
    }

    await carRentalDetail.destroy();

    res.status(200).json({
      success: true,
      message: "Car rental detail deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car rental detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete car rental detail",
    });
  }
});

// GET route for chart data (daily car rental bookings)
router.get("/stats/chart", async (req, res) => {
  try {
    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const carRentalDetails = await CarRentalDetail.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [fn("DATE", col("createdAt")), "date"], // Use fn and col from sequelize
        [fn("COUNT", col("id")), "count"],
      ],
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
    });

    // Format data for Chart.js
    const labels = [];
    const data = [];

    // Create a map of dates to counts
    const dateMap = new Map();
    carRentalDetails.forEach((item) => {
      dateMap.set(
        item.getDataValue("date"),
        Number.parseInt(item.getDataValue("count"))
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

    // Get status statistics - check if status column exists
    let statusData = [];
    try {
      const statusStats = await CarRentalDetail.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        order: [[col("count"), "DESC"]],
      });

      // Format status data
      statusData = statusStats.map((stat) => ({
        status: stat.status || "pending",
        count: Number.parseInt(stat.getDataValue("count")),
      }));
    } catch (error) {
      console.error("Error fetching status statistics:", error);
      // Provide default status data if column doesn't exist
      statusData = [
        { status: "pending", count: 0 },
        { status: "confirmed", count: 0 },
        { status: "cancelled", count: 0 },
      ];
    }

    res.status(200).json({
      success: true,
      data: {
        timeSeriesData: {
          labels,
          datasets: [
            {
              label: "Car Rental Bookings",
              data,
              backgroundColor: "rgba(156, 39, 176, 0.5)",
              borderColor: "rgba(156, 39, 176, 1)",
              borderWidth: 1,
            },
          ],
        },
        statusData,
      },
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message,
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
