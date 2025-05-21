const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const emailTemplates = {
  visitorQRCode: (visitorName, qrCodeUrl) => ({
    subject: 'Your Visitor QR Code',
    html: `
      <h2>Welcome ${visitorName}!</h2>
      <p>Your QR code for check-in is attached below.</p>
      <p>Please present this QR code at the reception when you arrive.</p>
      <img src="${qrCodeUrl}" alt="Visitor QR Code" style="max-width: 300px;">
      <p>This QR code is valid for 24 hours.</p>
    `
  }),
  
  visitorReminder: (visitorName, visitDate) => ({
    subject: 'Reminder: Upcoming Visit',
    html: `
      <h2>Visit Reminder</h2>
      <p>Dear ${visitorName},</p>
      <p>This is a reminder that you have a scheduled visit on ${visitDate}.</p>
      <p>Please don't forget to bring your QR code.</p>
    `
  }),
  
  newVisitorAlert: (visitorName, visitDate, purpose) => ({
    subject: 'New Visitor Alert',
    html: `
      <h2>New Visitor Alert</h2>
      <p>A new visitor has been registered:</p>
      <ul>
        <li>Name: ${visitorName}</li>
        <li>Visit Date: ${visitDate}</li>
        <li>Purpose: ${purpose}</li>
      </ul>
    `
  }),
  
  dailyReport: (reportData) => ({
    subject: 'Daily Visitor Report',
    html: `
      <h2>Daily Visitor Report</h2>
      <p>Total Visitors: ${reportData.totalVisitors}</p>
      <p>Checked In: ${reportData.checkedIn}</p>
      <p>Checked Out: ${reportData.checkedOut}</p>
      <p>Top Visit Purposes:</p>
      <ul>
        ${reportData.topPurposes.map(p => `<li>${p.purpose}: ${p.count}</li>`).join('')}
      </ul>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmail,
  emailTemplates
}; 