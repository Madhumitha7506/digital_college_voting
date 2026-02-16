// backend/utils/notifications.js - EMAIL & SMS UTILITIES

const nodemailer = require("nodemailer");

/* ====================================
   EMAIL CONFIGURATION (Using Gmail/SMTP)
   ==================================== */
const createEmailTransporter = () => {
  // Try SMTP configuration first, fallback to simple Gmail
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }
  
  // Fallback to simple Gmail service
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/* ====================================
   SEND KYC APPROVAL EMAIL
   ==================================== */
const sendKycApprovalEmail = async (to, voterName) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || `"Anna Adarsh College" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "✅ KYC Verification Approved - Anna Adarsh Election",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">🎉 KYC Verification Approved!</h2>
          
          <p>Dear <strong>${voterName}</strong>,</p>
          
          <p>Congratulations! Your identity verification (KYC) has been successfully approved by our admin team.</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✅ Status:</strong> Verified</p>
            <p style="margin: 10px 0 0 0;"><strong>📅 Approved On:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          </div>
          
          <p>You are now eligible to participate in the upcoming college elections. You can:</p>
          <ul>
            <li>✅ Cast your vote during the election period</li>
            <li>✅ View election results</li>
            <li>✅ Access all voter features</li>
          </ul>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Anna Adarsh College Election Committee</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ KYC approval email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND SMS USING TWILIO (Optional)
   ==================================== */
const sendKycApprovalSMS = async (phoneNumber, voterName) => {
  try {
    // Install: npm install twilio
    const twilio = require("twilio");
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.log("⚠️ Twilio credentials not configured, skipping SMS");
      return { success: false, error: "Twilio not configured" };
    }

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: `Hi ${voterName}, Your KYC verification has been approved! You are now eligible to vote in Anna Adarsh College Elections. - Election Committee`,
      from: fromNumber,
      to: phoneNumber,
    });

    console.log("✅ SMS sent:", message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error("❌ SMS sending failed:", error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND SMS USING MSG91 (Indian Alternative)
   ==================================== */
const sendKycApprovalSMS_MSG91 = async (phoneNumber, voterName) => {
  try {
    const axios = require("axios");
    
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "ANNELC";
    const route = process.env.MSG91_ROUTE || "4"; // Transactional route

    if (!authKey) {
      console.log("⚠️ MSG91 credentials not configured, skipping SMS");
      return { success: false, error: "MSG91 not configured" };
    }

    // Remove +91 if present
    const cleanPhone = phoneNumber.replace(/^\+91/, "");

    const message = `Hi ${voterName}, Your KYC has been approved! You can now vote in Anna Adarsh Elections. -Election Committee`;

    const url = `https://api.msg91.com/api/v2/sendsms`;

    const response = await axios.post(url, {
      sender: senderId,
      route: route,
      country: "91",
      sms: [
        {
          message: message,
          to: [cleanPhone],
        },
      ],
    }, {
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ MSG91 SMS sent:", response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("❌ MSG91 SMS failed:", error);
    return { success: false, error: error.message };
  }
};

/* ====================================
   SEND OTP VIA SMS (For Registration)
   ==================================== */
const sendOtpSMS = async (phoneNumber, otp) => {
  try {
    const axios = require("axios");
    
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "ANNELC";

    if (!authKey) {
      console.log("⚠️ MSG91 not configured, OTP:", otp);
      return { success: false, error: "MSG91 not configured", otp };
    }

    const cleanPhone = phoneNumber.replace(/^\+91/, "");
    const message = `Your OTP for Anna Adarsh College Election registration is: ${otp}. Valid for 10 minutes. Do not share this OTP.`;

    const url = `https://api.msg91.com/api/v2/sendsms`;

    const response = await axios.post(url, {
      sender: senderId,
      route: "4",
      country: "91",
      sms: [
        {
          message: message,
          to: [cleanPhone],
        },
      ],
    }, {
      headers: {
        "authkey": authKey,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ OTP SMS sent to", cleanPhone);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("❌ OTP SMS failed:", error);
    return { success: false, error: error.message, otp };
  }
};

module.exports = {
  sendKycApprovalEmail,
  sendKycApprovalSMS,
  sendKycApprovalSMS_MSG91,
  sendOtpSMS,
};