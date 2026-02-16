const express = require("express");
const sql = require("mssql");
const multer = require("multer");
const path = require("path");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ================= Multer Config ================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/announcements");
  },
  filename: function (req, file, cb) {
    const unique =
      Date.now() + "-" + file.originalname.replace(/\s/g, "");
    cb(null, unique);
  },
});

const upload = multer({ storage });

/* ================= POST Announcement ================= */

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, message, eventDate } = req.body;

      const imageUrl = req.file
        ? `/uploads/announcements/${req.file.filename}`
        : null;

      const candidate = await pool
        .request()
        .input("UserId", sql.Int, req.user.id)
        .query(
          "SELECT CandidateId FROM dbo.Candidates WHERE UserId = @UserId"
        );

      if (candidate.recordset.length === 0) {
        return res.status(403).json({ error: "Not a candidate" });
      }

      const candidateId = candidate.recordset[0].CandidateId;

      await pool
        .request()
        .input("CandidateId", sql.Int, candidateId)
        .input("Title", sql.NVarChar(150), title)
        .input("Message", sql.NVarChar(sql.MAX), message)
        .input("ImageUrl", sql.NVarChar(255), imageUrl)
        .input("EventDate", sql.DateTime, eventDate || null)
        .query(`
          INSERT INTO dbo.CandidateAnnouncements
          (CandidateId, Title, Message, ImageUrl, EventDate)
          VALUES
          (@CandidateId, @Title, @Message, @ImageUrl, @EventDate)
        `);

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to post announcement" });
    }
  }
);

/* ================= GET Announcements ================= */

router.get("/", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        a.Id,
        a.Title,
        a.Message,
        a.ImageUrl,
        a.EventDate,
        a.CreatedAt,
        c.Name AS CandidateName,
        c.Position,
        c.Department
      FROM dbo.CandidateAnnouncements a
      INNER JOIN dbo.Candidates c
        ON a.CandidateId = c.CandidateId
      ORDER BY a.CreatedAt DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

module.exports = router;
