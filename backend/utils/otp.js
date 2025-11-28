// backend/utils/otp.js
const nodemailer = require('nodemailer');
require('dotenv').config();

let twilioClient = null;

// Only initialize Twilio if credentials look valid
if (
  process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') &&
  process.env.TWILIO_AUTH_TOKEN
) {
  const twilio = require('twilio');
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('✅ Twilio initialized for SMS OTP');
} else {
  console.warn('⚠️ Twilio not configured — SMS OTPs will be simulated locally');
}

// Email transporter (for email OTP)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTP = async (email, phone, otpCode) => {
  try {
    // Send Email OTP
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify Your Account - Voting System',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP code is: <strong>${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    // Send or simulate SMS OTP
    if (twilioClient) {
      await twilioClient.messages.create({
        body: `Your voting system verification code is: ${otpCode}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      console.log(`✅ Real SMS OTP sent to ${phone}`);
    } else {
      console.log(`📱 Simulated SMS OTP for ${phone}: ${otpCode}`);
    }

    console.log('✅ OTP sent successfully via email');
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    throw error;
  }
};

module.exports = { sendOTP };
