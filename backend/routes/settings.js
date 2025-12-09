// backend/routes/settings.js
const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   GET /api/settings/profile
   - For logged-in voter: returns their profile
   =========================================================== */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "voter") {
      return res
        .status(403)
        .json({ error: "Only voters can edit profile in this endpoint" });
    }

    const request = pool.request();
    request.input("VoterId", sql.Int, id);

    const result = await request.query(`
      SELECT 
        VoterId,
        FullName,
        Email,
        Phone,
        Gender,
        StudentId,
        DateOfBirth
      FROM dbo.Voters
      WHERE VoterId = @VoterId;
    `);

    const row = result.recordset[0];
    if (!row) {
      return res.status(404).json({ error: "Voter not found" });
    }

    res.json(row);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to load profile settings" });
  }
});

/* ===========================================================
   PUT /api/settings/profile
   Body: { fullName, email, phone, dateOfBirth }
   - Only voters can update their profile
   =========================================================== */
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role !== "voter") {
      return res
        .status(403)
        .json({ error: "Only voters can update this profile" });
    }

    const { fullName, email, phone, dateOfBirth } = req.body;

    if (!fullName || !email) {
      return res
        .status(400)
        .json({ error: "Full name and email are required" });
    }

    const request = pool.request();
    request.input("VoterId", sql.Int, id);
    request.input("FullName", sql.NVarChar(200), fullName);
    request.input("Email", sql.NVarChar(200), email);
    request.input("Phone", sql.NVarChar(50), phone || null);
    request.input(
      "DateOfBirth",
      sql.Date,
      dateOfBirth && dateOfBirth.trim() !== "" ? dateOfBirth : null
    );

    await request.query(`
      UPDATE dbo.Voters
      SET 
        FullName = @FullName,
        Email = @Email,
        Phone = @Phone,
        DateOfBirth = @DateOfBirth
      WHERE VoterId = @VoterId;
    `);

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to update profile settings" });
  }
});

/* ===========================================================
   GET /api/settings/election-date
   - Any logged-in user (admin or voter) can read
   - Returns: { electionDate: "YYYY-MM-DD" | null }
   =========================================================== */
router.get("/election-date", authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.query(`
      SELECT TOP 1 SettingValue, CreatedAt
      FROM dbo.SystemSettings
      WHERE SettingKey = 'ElectionDate'
      ORDER BY CreatedAt DESC;
    `);

    if (result.recordset.length === 0) {
      return res.json({ electionDate: null });
    }

    res.json({ electionDate: result.recordset[0].SettingValue });
  } catch (err) {
    console.error("❌ Error getting election date:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to load election date" });
  }
});

/* ===========================================================
   PUT /api/settings/election-date
   - Admin only: set / change election date
   Body: { electionDate: "YYYY-MM-DD" }
   =========================================================== */
router.put(
  "/election-date",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { electionDate } = req.body;

      if (!electionDate) {
        return res
          .status(400)
          .json({ error: "Election date (YYYY-MM-DD) is required" });
      }

      const request = pool.request();
      request.input("ElectionDate", sql.NVarChar(50), electionDate);

      await request.query(`
        IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = 'ElectionDate')
        BEGIN
          UPDATE dbo.SystemSettings
          SET SettingValue = @ElectionDate, CreatedAt = SYSDATETIME()
          WHERE SettingKey = 'ElectionDate';
        END
        ELSE
        BEGIN
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
          VALUES ('ElectionDate', @ElectionDate);
        END;
      `);

      res.json({
        success: true,
        message: "Election date updated successfully",
      });
    } catch (err) {
      console.error("❌ Error updating election date:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to update election date" });
    }
  }
);

module.exports = router;
