const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   Generate OTP (for Admin or Voter)
   Calls: sp_GenerateOTP
   =========================================================== */
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const request = pool.request();
    request.input("VoterId", sql.Int, userId);
    request.input("OtpLength", sql.Int, 6);
    request.input("ValidForMinutes", sql.Int, 5);
    request.output("OTPCode", sql.NVarChar(20));

    const result = await request.execute("sp_GenerateOTP");
    const otpCode = result.output.OTPCode;

    // For demo: just return OTP (later you’ll send via SMS/email)
    res.json({
      success: true,
      otp: otpCode,
      message: "OTP generated successfully (for demo only).",
    });
  } catch (err) {
    console.error("❌ OTP generation error:", err);
    res.status(500).json({ error: "Failed to generate OTP" });
  }
});

/* ===========================================================
   Verify OTP
   Calls: sp_VerifyOTP
   =========================================================== */
router.post("/verify", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otpCode } = req.body;

    const request = pool.request();
    request.input("VoterId", sql.Int, userId);
    request.input("OTPCode", sql.NVarChar, otpCode);
    request.input("MarkVerified", sql.Bit, 1);
    request.output("IsValid", sql.Bit);
    request.output("Message", sql.NVarChar(200));

    const result = await request.execute("sp_VerifyOTP");

    const isValid = result.output.IsValid;
    const message = result.output.Message;

    if (!isValid) {
      return res.status(400).json({ success: false, message });
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error("❌ OTP verification error:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

module.exports = router;
