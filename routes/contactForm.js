const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/emailConfig");
const { ContactForm } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");

// POST route for form submission
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const contact = await ContactForm.create(req.body);

    // Prepare and send admin email
    try {
      const mailOptions = {
        subject: `Contact Form: ${subject || "New Message"}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Subject:</strong> ${subject || "Not specified"}</p>
          <h3>Message:</h3>
          <p>${message}</p>
          <hr>
          <p><em>This message was submitted from the Contact form on the RPS Tours website.</em></p>
        `,
      };

      await sendEmail(mailOptions);
    } catch (emailError) {
      console.error("Admin email send failed:", emailError.message);
    }

    // Prepare and send confirmation email to user
    try {
      const confirmationMailOptions = {
        to: email,
        subject: `Thank you for contacting us - RPS Tours`,
        html: `
          <h2>Thank You for Contacting Us</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and our team will get back to you shortly.</p>
          <p>Best Regards,<br>RPS Tours Team</p>
        `,
      };

      await sendEmail(confirmationMailOptions);
    } catch (confirmError) {
      console.error("User confirmation email send failed:", confirmError.message);
    }

    // Finally respond to frontend
    return res.status(200).json({
      success: true,
      message:
        "Your message has been submitted successfully. We will contact you soon!",
      data: contact,
    });
  } catch (error) {
    console.error("Contact form submission error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error: Could not process your message.",
    });
  }
});


// GET route for retrieving all contact form submissions
router.get("/", async (req, res) => {
  try {
    const contacts = await ContactForm.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Error fetching contact form submissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact form submissions",
    });
  }
});

// GET route for chart data
router.get("/chart", async (req, res) => {
  try {
    // Get the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const contactForms = await ContactForm.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [fn("DATE", col("createdAt")), "date"], // Use imported fn and col
        [fn("COUNT", col("id")), "count"], // Use imported fn and col
      ],
      group: [fn("DATE", col("createdAt"))], // Use imported fn and col
      order: [[fn("DATE", col("createdAt")), "ASC"]],
    });

    // Format data for Chart.js
    const labels = [];
    const data = [];

    // Create a map of dates to counts
    const dateMap = new Map();
    contactForms.forEach((item) => {
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

    res.status(200).json({
      success: true,
      data: {
        labels,
        datasets: [
          {
            label: "Contact Form Submissions",
            data,
            backgroundColor: "rgba(230, 57, 70, 0.5)",
            borderColor: "rgba(230, 57, 70, 1)",
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

// GET a single contact form submission by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactForm.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact form submission not found",
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact form submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact form submission",
    });
  }
});

// UPDATE a contact form submission
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactForm.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact form submission not found",
      });
    }

    // Update contact
    await contact.update(req.body);

    res.status(200).json({
      success: true,
      message: "Contact form submission updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error updating contact form submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact form submission",
    });
  }
});

// DELETE a contact form submission
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactForm.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact form submission not found",
      });
    }

    // Delete contact
    await contact.destroy();

    res.status(200).json({
      success: true,
      message: "Contact form submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact form submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete contact form submission",
    });
  }
});

module.exports = router;
