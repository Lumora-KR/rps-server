// routes/enquiryHandler.js
const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");

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

    let subject = "";
    let htmlContent = "";

    // Generate email content based on form type
    if (formType === "cars") {
      const { fromLocation, toLocation, pickupDate, carType } = req.body;

      // Validate required car fields
      if (!fromLocation || !toLocation || !pickupDate) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required car rental fields",
        });
      }

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

      // Validate required tour package fields
      if (!packageType || !travelDate) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required tour package fields",
        });
      }

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

      // Validate required hotel fields
      if (!destination || !checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required hotel booking fields",
        });
      }

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
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid form type",
      });
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
        <p>Here's a summary of your enquiry:</p>
        <hr>
        ${getConfirmationContent(formType, req.body)}
        <hr>
        <p>If you have any urgent questions, please contact us directly at our customer service number.</p>
        <p>Best Regards,<br>RPS Tours Team</p>
      `,
    };

    await sendEmail(confirmationMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Your enquiry has been sent successfully. We will contact you soon!",
    });
  } catch (error) {
    console.error("Enquiry form submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send your enquiry. Please try again later.",
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

// Generate confirmation email content based on form type
const getConfirmationContent = (formType, data) => {
  if (formType === "cars") {
    return `
      <p><strong>Service:</strong> Car Rental</p>
      <p><strong>From:</strong> ${data.fromLocation}</p>
      <p><strong>To:</strong> ${data.toLocation}</p>
      <p><strong>Pickup Date:</strong> ${formatDate(data.pickupDate)}</p>
      <p><strong>Car Type:</strong> ${data.carType || "Not specified"}</p>
    `;
  } else if (formType === "tourPackages") {
    return `
      <p><strong>Service:</strong> Tour Package</p>
      <p><strong>Package:</strong> ${data.packageType}</p>
      <p><strong>Travel Date:</strong> ${formatDate(data.travelDate)}</p>
      <p><strong>Duration:</strong> ${data.duration || "Not specified"}</p>
      <p><strong>Number of Travelers:</strong> ${
        data.travelers || "Not specified"
      }</p>
    `;
  } else if (formType === "hotels") {
    return `
      <p><strong>Service:</strong> Hotel Booking</p>
      <p><strong>Destination:</strong> ${data.destination}</p>
      <p><strong>Check-in Date:</strong> ${formatDate(data.checkIn)}</p>
      <p><strong>Check-out Date:</strong> ${formatDate(data.checkOut)}</p>
      <p><strong>Number of Rooms:</strong> ${data.rooms || "1"}</p>
    `;
  }

  return "";
};

module.exports = router;
