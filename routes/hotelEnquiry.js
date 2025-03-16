// routes/hotelEnquiry.js
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

// GET route for retrieving all hotel enquiries
router.get("/", async (req, res) => {
  try {
    const hotelEnquiries = await HotelEnquiry.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: hotelEnquiries,
    });
  } catch (error) {
    console.error("Error fetching hotel enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hotel enquiries",
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
