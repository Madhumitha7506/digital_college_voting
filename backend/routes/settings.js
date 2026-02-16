// routes/settings.js - COMPLETE AND PROPERLY EXPORTED

const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const {
  sendKycApprovalEmail,
  sendKycApprovalSMS_MSG91,
} = require("../utils/notifications");

const router = express.Router();

/* ====================================
   ADMIN: VERIFY/APPROVE KYC
   WITH EMAIL & SMS NOTIFICATIONS
   ==================================== */
router.put("/admin/verify-kyc/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const voterId = parseInt(req.params.id);
    const adminName = req.user?.name || req.user?.fullName || "Admin";
    
    console.log("=== Approving KYC for VoterId:", voterId, "===");

    // Get voter details for notifications
    const voterResult = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query(`
        SELECT FullName, Email, Phone
        FROM dbo.Voters
        WHERE VoterId = @VoterId
      `);

    if (voterResult.recordset.length === 0) {
      return res.status(404).json({ error: "Voter not found" });
    }

    const voter = voterResult.recordset[0];

    // Update KYC status
    await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .input("AdminName", sql.NVarChar(200), adminName)
      .query(`
        UPDATE dbo.Voters
        SET 
          IsKycVerified = 1,
          IsKycRejected = 0,
          KycRejectedReason = NULL,
          KycVerifiedAt = GETDATE(),
          KycVerifiedBy = @AdminName
        WHERE VoterId = @VoterId
      `);

    console.log("✅ KYC approved successfully");

    // Send email notification
    if (voter.Email) {
      const emailResult = await sendKycApprovalEmail(voter.Email, voter.FullName);
      if (emailResult.success) {
        console.log("✅ Approval email sent to", voter.Email);
      } else {
        console.log("⚠️ Email failed:", emailResult.error);
      }
    }

    // Send SMS notification
    if (voter.Phone) {
      const smsResult = await sendKycApprovalSMS_MSG91(voter.Phone, voter.FullName);
      if (smsResult.success) {
        console.log("✅ Approval SMS sent to", voter.Phone);
      } else {
        console.log("⚠️ SMS failed:", smsResult.error);
      }
    }

    res.json({ 
      success: true, 
      message: "KYC verified and notifications sent successfully" 
    });

  } catch (err) {
    console.error("❌ KYC verification error:", err);
    res.status(500).json({ 
      error: "Failed to verify KYC",
      details: err.message 
    });
  }
});

/* ====================================
   ADMIN: GET PENDING KYC REQUESTS
   ==================================== */
router.get("/admin/pending-kyc", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log("=== Fetching Pending KYC Requests ===");

    const result = await pool.request().query(`
      SELECT 
        VoterId,
        FullName,
        Email,
        StudentId,
        AadhaarNumber,
        PANNumber,
        ElectionId,
        IsKycVerified,
        IsKycRejected,
        KycRejectedReason,
        KycVerifiedAt,
        KycVerifiedBy
      FROM dbo.Voters
      WHERE 
        (AadhaarNumber IS NOT NULL OR PANNumber IS NOT NULL OR ElectionId IS NOT NULL)
        AND (IsKycVerified = 0 OR IsKycVerified IS NULL)
        AND (IsKycRejected = 0 OR IsKycRejected IS NULL)
      ORDER BY VoterId DESC
    `);

    console.log("✅ Found", result.recordset.length, "pending KYC requests");
    res.json(result.recordset);

  } catch (err) {
    console.error("❌ Fetch pending KYC error:", err);
    res.status(500).json({ 
      error: "Failed to fetch KYC requests",
      details: err.message 
    });
  }
});

/* ====================================
   VOTER: GET OWN PROFILE
   ==================================== */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.id;
    console.log("=== Fetching Profile for VoterId:", voterId, "===");

    const result = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query(`
        SELECT 
          FullName AS fullName,
          Email AS email,
          Phone AS phone,
          StudentId AS studentId,
          DateOfBirth AS dateOfBirth,
          AadhaarNumber AS aadhaarNumber,
          PANNumber AS panNumber,
          ElectionId AS electionId,
          IsKycVerified AS isKycVerified,
          IsKycRejected AS isKycRejected,
          KycRejectedReason AS kycRejectedReason
        FROM dbo.Voters
        WHERE VoterId = @VoterId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = result.recordset[0];
    
    // Format date for input field
    if (profile.dateOfBirth) {
      profile.dateOfBirth = new Date(profile.dateOfBirth)
        .toISOString()
        .split("T")[0];
    }

    console.log("✅ Profile fetched successfully");
    res.json(profile);

  } catch (err) {
    console.error("❌ Fetch profile error:", err);
    res.status(500).json({ 
      error: "Failed to fetch profile",
      details: err.message 
    });
  }
});

/* ====================================
   VOTER: UPDATE PROFILE
   ==================================== */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.id;
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      aadhaarNumber,
      panNumber,
      electionId,
    } = req.body;

    console.log("=== Updating Profile for VoterId:", voterId, "===");

    await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .input("FullName", sql.NVarChar(100), fullName)
      .input("Email", sql.NVarChar(100), email)
      .input("Phone", sql.NVarChar(15), phone || null)
      .input("DateOfBirth", sql.Date, dateOfBirth || null)
      .input("AadhaarNumber", sql.NVarChar(20), aadhaarNumber || null)
      .input("PANNumber", sql.NVarChar(20), panNumber || null)
      .input("ElectionId", sql.NVarChar(30), electionId || null)
      .query(`
        UPDATE dbo.Voters
        SET 
          FullName = @FullName,
          Email = @Email,
          Phone = @Phone,
          DateOfBirth = @DateOfBirth,
          AadhaarNumber = @AadhaarNumber,
          PANNumber = @PANNumber,
          ElectionId = @ElectionId
        WHERE VoterId = @VoterId
      `);

    console.log("✅ Profile updated successfully");
    res.json({ success: true, message: "Profile updated successfully" });

  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ 
      error: "Failed to update profile",
      details: err.message 
    });
  }
});

/* ====================================
   GET SYSTEM DATES (Election Schedule)
   ==================================== */
router.get("/system-dates", authenticateToken, async (req, res) => {
  try {
    console.log("=== Fetching System Dates ===");

    const result = await pool.request().query(`
      SELECT 
        SettingKey,
        SettingValue
      FROM dbo.SystemSettings
      WHERE SettingKey IN ('VotingStart', 'VotingEnd', 'ResultPublish')
    `);

    console.log("Raw data from DB:", result.recordset);

    const settings = {
      votingStart: "",
      votingEnd: "",
      resultPublish: "",
    };

    result.recordset.forEach((row) => {
      const value = row.SettingValue;
      
      // Convert to datetime-local format if it's a valid date
      let formattedValue = "";
      if (value && value.trim() !== "") {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DDTHH:mm for datetime-local input
            formattedValue = date.toISOString().slice(0, 16);
          } else {
            formattedValue = value;
          }
        } catch (e) {
          formattedValue = value;
        }
      }

      if (row.SettingKey === "VotingStart") {
        settings.votingStart = formattedValue;
      } else if (row.SettingKey === "VotingEnd") {
        settings.votingEnd = formattedValue;
      } else if (row.SettingKey === "ResultPublish") {
        settings.resultPublish = formattedValue;
      }
    });

    console.log("✅ Returning formatted settings:", settings);
    res.json(settings);

  } catch (err) {
    console.error("❌ Fetch system dates error:", err);
    res.status(500).json({ 
      error: "Failed to fetch system dates",
      details: err.message 
    });
  }
});

/* ====================================
   UPDATE SYSTEM DATES (Admin Only)
   ==================================== */
router.put("/system-dates", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { votingStart, votingEnd, resultPublish } = req.body;

    console.log("=== Updating System Dates ===");
    console.log("Received data:", { votingStart, votingEnd, resultPublish });

    const settings = [
      { key: "VotingStart", value: votingStart },
      { key: "VotingEnd", value: votingEnd },
      { key: "ResultPublish", value: resultPublish },
    ];

    for (const setting of settings) {
      console.log(`Processing ${setting.key}:`, setting.value);

      // Check if setting exists
      const checkResult = await pool
        .request()
        .input("SettingKey", sql.NVarChar(100), setting.key)
        .query(`
          SELECT COUNT(*) AS Count 
          FROM dbo.SystemSettings 
          WHERE SettingKey = @SettingKey
        `);

      const exists = checkResult.recordset[0].Count > 0;
      console.log(`${setting.key} exists:`, exists);

      if (!exists) {
        // Insert new setting
        await pool
          .request()
          .input("SettingKey", sql.NVarChar(100), setting.key)
          .input("SettingValue", sql.NVarChar(sql.MAX), setting.value || "")
          .query(`
            INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
            VALUES (@SettingKey, @SettingValue)
          `);
        console.log(`✅ Inserted ${setting.key}`);
      } else {
        // Update existing setting
        await pool
          .request()
          .input("SettingKey", sql.NVarChar(100), setting.key)
          .input("SettingValue", sql.NVarChar(sql.MAX), setting.value || "")
          .query(`
            UPDATE dbo.SystemSettings
            SET SettingValue = @SettingValue
            WHERE SettingKey = @SettingKey
          `);
        console.log(`✅ Updated ${setting.key}`);
      }
    }

    // Verify the update
    const verifyResult = await pool.request().query(`
      SELECT SettingKey, SettingValue
      FROM dbo.SystemSettings
      WHERE SettingKey IN ('VotingStart', 'VotingEnd', 'ResultPublish')
    `);
    console.log("Verification after update:", verifyResult.recordset);

    res.json({ 
      success: true, 
      message: "System dates updated successfully",
      updated: verifyResult.recordset
    });

  } catch (err) {
    console.error("❌ Update system dates error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to update system dates",
      details: err.message 
    });
  }
});

// ✅ CRITICAL: Export the router properly
module.exports = router;