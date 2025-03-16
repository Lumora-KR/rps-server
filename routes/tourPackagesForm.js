// routes/tourPackagesForm.js
const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailConfig');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, destination, travelDate, adults, children, budget, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    // Prepare email content
    const mailOptions = {
      subject: `Tour Package Enquiry: ${destination || 'General Inquiry'}`,
      html: `
        <h2>New Tour Package Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Destination:</strong> ${destination || 'Not specified'}</p>
        <p><strong>Travel Date:</strong> ${travelDate || 'Not specified'}</p>
        <p><strong>Number of Adults:</strong> ${adults || '1'}</p>
        <p><strong>Number of Children:</strong> ${children || '0'}</p>
        <p><strong>Budget:</strong> ₹${budget || 'Not specified'}</p>
        <h3>Additional Requirements:</h3>
        <p>${message || 'No additional requirements provided'}</p>
        <hr>
        <p><em>This enquiry was submitted from the Tour Packages page on the RPS Tours website.</em></p>
      `
    };
    
    // Send email
    const result = await sendEmail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Your tour package enquiry has been sent successfully. We will contact you soon!'
    });
  } catch (error) {
    console.error('Tour packages form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send your enquiry. Please try again later.'
    });
  }
});

module.exports = router;