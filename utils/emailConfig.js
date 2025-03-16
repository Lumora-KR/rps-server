// utils/emailConfig.js
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email function
const sendEmail = async (options) => {
  try {
    // Default email options
    const mailOptions = {
      from: `"RPS Tours" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to || process.env.EMAIL_TO || "admin@rpstours.com",
      subject: options.subject || "New Message from RPS Tours Website",
      html: options.html || "<p>No content provided</p>",
    };

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
