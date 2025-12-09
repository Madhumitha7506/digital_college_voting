// backend/routes/feedback.js
const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   POST /api/feedback
   Body: { message?: string, feedback?: string, rating?: number }
   Uses: sp_AddFeedback
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { message, feedback, rating } = req.body;
    const text = (message || feedback || "").trim();

    if (!text) {
      return res.status(400).json({ error: "Feedback message is required" });
    }

    const request = pool.request();
    request.input("VoterId", sql.Int, user.id);
    request.input("Message", sql.NVarChar(1000), text);
    request.input("Rating", sql.Int, rating ?? null);
    request.output("FeedbackId", sql.Int);

    const result = await request.execute("sp_AddFeedback");

    res.json({
      success: true,
      FeedbackId: result.output.FeedbackId,
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    console.error("❌ Error submitting feedback:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to submit feedback" });
  }
});

/* ===========================================================
   GET /api/feedback  (Admin only)
   View all feedback with voter info
   =========================================================== */
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.query(`
      SELECT 
        f.FeedbackId,
        f.Message,
        f.Rating,
        f.CreatedAt,
        v.VoterId,
        v.FullName,
        v.Email,
        v.StudentId
      FROM dbo.Feedback f
      INNER JOIN dbo.Voters v ON f.VoterId = v.VoterId
      ORDER BY f.CreatedAt DESC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching feedback:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

module.exports = router;
