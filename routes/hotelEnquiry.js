const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { HotelEnquiry, Hotel } = require("../models");
const { Op, fn, col } = require("sequelize");

// POST route for hotel enquiry submission
router.post("/", async (req, res) => {
  try {
    const {
      hotelId,
      hotelName,
      name,
      email,
      phone,
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      message,
    } = req.body;

    // Validate required fields
    if (
      !hotelId ||
      !name ||
      !email ||
      !phone ||
      !checkInDate ||
      !checkOutDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Find the hotel to get provider details
    const hotel = await Hotel.findByPk(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Save to database
    const hotelEnquiry = await HotelEnquiry.create({
      hotelId,
      hotelName: hotelName || hotel.name,
      name,
      email,
      phone,
      checkInDate,
      checkOutDate,
      guests: guests || 1,
      rooms: rooms || 1,
      message,
      status: "pending",
    });

    // Prepare email content for admin
    const adminMailOptions = {
      subject: `New Hotel Booking Enquiry: ${hotel.name}`,
      html: `
        <h2>New Hotel Booking Enquiry</h2>
        <p><strong>Hotel:</strong> ${hotel.name}</p>
        <p><strong>Location:</strong> ${hotel.location}</p>
        <hr>
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr>
        <h3>Booking Details:</h3>
        <p><strong>Check-in Date:</strong> ${formatDate(checkInDate)}</p>
        <p><strong>Check-out Date:</strong> ${formatDate(checkOutDate)}</p>
        <p><strong>Guests:</strong> ${guests || 1}</p>
        <p><strong>Rooms:</strong> ${rooms || 1}</p>
        <h3>Special Requirements:</h3>
        <p>${message || "No special requirements provided"}</p>
        <hr>
        <p><em>This booking enquiry was submitted from the Hotel Enquiry page on the RPS Tours website.</em></p>
      `,
    };

    // Send email to admin
    await sendEmail(adminMailOptions);

    // Prepare email content for hotel provider
    const providerMailOptions = {
      to: hotel.providerEmail,
      subject: `New Booking Enquiry for ${hotel.name}`,
      html: `
        <h2>New Booking Enquiry for Your Hotel</h2>
        <p>Dear ${hotel.providerName},</p>
        <p>You have received a new booking enquiry for ${hotel.name}.</p>
        <hr>
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr>
        <h3>Booking Details:</h3>
        <p><strong>Check-in Date:</strong> ${formatDate(checkInDate)}</p>
        <p><strong>Check-out Date:</strong> ${formatDate(checkOutDate)}</p>
        <p><strong>Guests:</strong> ${guests || 1}</p>
        <p><strong>Rooms:</strong> ${rooms || 1}</p>
        <h3>Special Requirements:</h3>
        <p>${message || "No special requirements provided"}</p>
        <hr>
        <p>Please contact the customer directly to confirm the booking.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    // Send email to hotel provider
    await sendEmail(providerMailOptions);

    // Send confirmation email to customer
    const confirmationMailOptions = {
      to: email,
      subject: `Hotel Booking Enquiry Confirmation - RPS Tours`,
      html: `
        <h2>Thank You for Your Hotel Booking Enquiry</h2>
        <p>Dear ${name},</p>
        <p>We have received your booking enquiry for ${
          hotel.name
        } and have forwarded it to the hotel. They will contact you shortly to confirm your reservation.</p>
        <p>Your booking details:</p>
        <ul>
          <li><strong>Hotel:</strong> ${hotel.name}</li>
          <li><strong>Location:</strong> ${hotel.location}</li>
          <li><strong>Check-in Date:</strong> ${formatDate(checkInDate)}</li>
          <li><strong>Check-out Date:</strong> ${formatDate(checkOutDate)}</li>
          <li><strong>Guests:</strong> ${guests || 1}</li>
          <li><strong>Rooms:</strong> ${rooms || 1}</li>
        </ul>
        <p>If you have any questions, please feel free to contact us.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    await sendEmail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Your hotel booking enquiry has been sent successfully. The hotel will contact you soon!",
      data: hotelEnquiry,
    });
  } catch (error) {
    console.error("Hotel enquiry submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your booking enquiry. Please try again later.",
    });
  }
});

// GET route for retrieving all hotel enquiries with pagination
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
          { hotelName: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const { count, rows: hotelEnquiries } = await HotelEnquiry.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: hotelEnquiries,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching hotel enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel enquiries",
    });
  }
});

// GET route for retrieving a specific hotel enquiry by ID
router.get("/:id", async (req, res) => {
  try {
    const hotelEnquiry = await HotelEnquiry.findByPk(req.params.id);

    if (!hotelEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Hotel enquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: hotelEnquiry,
    });
  } catch (error) {
    console.error("Error fetching hotel enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel enquiry",
    });
  }
});

// PUT route for updating a hotel enquiry
router.put("/:id", async (req, res) => {
  try {
    const {
      hotelId,
      hotelName,
      name,
      email,
      phone,
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      message,
      status,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const hotelEnquiry = await HotelEnquiry.findByPk(req.params.id);

    if (!hotelEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Hotel enquiry not found",
      });
    }

    // Update the hotel enquiry
    await hotelEnquiry.update({
      hotelId,
      hotelName,
      name,
      email,
      phone,
      checkInDate,
      checkOutDate,
      guests: guests || 1,
      rooms: rooms || 1,
      message,
      status,
    });

    // If status has changed, send notification email
    if (req.body.status && req.body.status !== hotelEnquiry.status) {
      const statusMailOptions = {
        to: email,
        subject: `Hotel Booking Status Update - RPS Tours`,
        html: `
          <h2>Your Hotel Booking Status Has Been Updated</h2>
          <p>Dear ${name},</p>
          <p>Your hotel booking request for ${hotelName} has been updated to: <strong>${status}</strong>.</p>
          <p>Your booking details:</p>
          <ul>
            <li><strong>Check-in Date:</strong> ${formatDate(checkInDate)}</li>
            <li><strong>Check-out Date:</strong> ${formatDate(
              checkOutDate
            )}</li>
            <li><strong>Guests:</strong> ${guests || 1}</li>
            <li><strong>Rooms:</strong> ${rooms || 1}</li>
          </ul>
          <p>If you have any questions, please feel free to contact us.</p>
          <p>Best Regards,<br>RPS Tours Team</p>
        `,
      };

      await sendEmail(statusMailOptions);
    }

    res.status(200).json({
      success: true,
      message: "Hotel enquiry updated successfully",
      data: hotelEnquiry,
    });
  } catch (error) {
    console.error("Error updating hotel enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update hotel enquiry",
    });
  }
});

// DELETE route for deleting a hotel enquiry
router.delete("/:id", async (req, res) => {
  try {
    const hotelEnquiry = await HotelEnquiry.findByPk(req.params.id);

    if (!hotelEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Hotel enquiry not found",
      });
    }

    await hotelEnquiry.destroy();

    res.status(200).json({
      success: true,
      message: "Hotel enquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hotel enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete hotel enquiry",
    });
  }
});

// GET route for chart data (daily hotel enquiries)
router.get("/stats/chart", async (req, res) => {
  try {
    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const hotelEnquiries = await HotelEnquiry.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
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
    hotelEnquiries.forEach((item) => {
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
      const statusStats = await HotelEnquiry.findAll({
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
              label: "Hotel Enquiries",
              data,
              backgroundColor: "rgba(33, 150, 243, 0.5)",
              borderColor: "rgba(33, 150, 243, 1)",
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
