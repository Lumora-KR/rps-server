// server/routes/homeEnquiryForm.js
const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { HomeEnquiry } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

// POST route for form submission
router.post("/", async (req, res) => {
  try {
    const { formType, name, email, phone } = req.body;

    // Validate required common fields
    if (!name || !email || !phone || !formType) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Save to database
    const enquiry = await HomeEnquiry.create(req.body);

    let subject = "";
    let htmlContent = "";

    // Generate email content based on form type
    if (formType === "cars") {
      const { fromLocation, toLocation, pickupDate, carType } = req.body;

      subject = `Car Rental Enquiry: ${fromLocation} to ${toLocation}`;
      htmlContent = `
        <h2>New Car Rental Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>From Location:</strong> ${fromLocation}</p>
        <p><strong>To Location:</strong> ${toLocation}</p>
        <p><strong>Pickup Date:</strong> ${formatDate(pickupDate)}</p>
        <p><strong>Car Type:</strong> ${carType || "Not specified"}</p>
        <hr>
        <p><em>This enquiry was submitted from the Car Rental form on the RPS Tours website.</em></p>
      `;
    } else if (formType === "tourPackages") {
      const { packageType, travelDate, duration, travelers } = req.body;

      subject = `Tour Package Enquiry: ${packageType}`;
      htmlContent = `
        <h2>New Tour Package Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Package Type:</strong> ${packageType}</p>
        <p><strong>Travel Date:</strong> ${formatDate(travelDate)}</p>
        <p><strong>Duration:</strong> ${duration || "Not specified"}</p>
        <p><strong>Number of Travelers:</strong> ${
          travelers || "Not specified"
        }</p>
        <hr>
        <p><em>This enquiry was submitted from the Tour Packages form on the RPS Tours website.</em></p>
      `;
    } else if (formType === "hotels") {
      const { destination, checkIn, checkOut, rooms } = req.body;

      subject = `Hotel Booking Enquiry: ${destination}`;
      htmlContent = `
        <h2>New Hotel Booking Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Destination:</strong> ${destination}</p>
        <p><strong>Check-in Date:</strong> ${formatDate(checkIn)}</p>
        <p><strong>Check-out Date:</strong> ${formatDate(checkOut)}</p>
        <p><strong>Number of Rooms:</strong> ${rooms || "1"}</p>
        <hr>
        <p><em>This enquiry was submitted from the Hotels form on the RPS Tours website.</em></p>
      `;
    }

    // Prepare email content
    const mailOptions = {
      subject: subject,
      html: htmlContent,
    };

    // Send email
    await sendEmail(mailOptions);

    // Send confirmation email to customer
    const confirmationMailOptions = {
      to: email,
      subject: `Thank you for your enquiry - RPS Tours`,
      html: `
        <h2>Thank You for Your Enquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your enquiry and our team will get back to you shortly.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    await sendEmail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Your enquiry has been sent successfully. We will contact you soon!",
      data: enquiry,
    });
  } catch (error) {
    console.error("Home enquiry form submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your enquiry. Please try again later.",
    });
  }
});

// GET route for retrieving all home enquiries
router.get("/", async (req, res) => {
  try {
    const enquiries = await HomeEnquiry.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    console.error("Error fetching home enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
});

// GET route for retrieving enquiries by type
router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (!["cars", "tourPackages", "hotels"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry type",
      });
    }

    const enquiries = await HomeEnquiry.findAll({
      where: { formType: type },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.type} enquiries:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
});

// GET route for chart data (daily enquiries)
router.get("/chart/:type", async (req, res) => {
  try {
    const { type } = req.params;

    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    let whereClause = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Add type filter if provided and valid
    if (type && ["cars", "tourPackages", "hotels"].includes(type)) {
      whereClause.formType = type;
    }

    const enquiries = await HomeEnquiry.findAll({
      where: whereClause,
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
    enquiries.forEach((item) => {
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
            label: `${type || "All"} Enquiries`,
            data,
            backgroundColor: "rgba(63, 81, 181, 0.5)",
            borderColor: "rgba(63, 81, 181, 1)",
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
