// backend/routes/feedback.js
const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   POST /api/feedback
   Body:
     {
       message: string,
       rating?: number,                 // overall / same as candidate satisfaction
       isRegisteredVoter?: "yes"|"no",
       candidateSatisfaction?: number,  // 1–5
       processTrust?: number,           // 1–5
       motivation?: "more"|"less"|"same"
     }
   Calls: sp_AddFeedback
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const {
      message,
      feedback,
      rating,
      isRegisteredVoter,
      candidateSatisfaction,
      processTrust,
      motivation,
    } = req.body;

    const text = (message || feedback || "").trim();

    if (!text) {
      return res.status(400).json({ error: "Feedback message is required" });
    }

    // 1) Check if feedback already exists for this voter
    const existing = await pool
      .request()
      .input("VoterId", sql.Int, user.id)
      .query(
        "SELECT TOP 1 FeedbackId FROM dbo.Feedback WHERE VoterId = @VoterId;"
      );

    if (existing.recordset.length > 0) {
      return res
        .status(400)
        .json({ error: "Feedback already submitted for this voter." });
    }

    const isRegBool =
      isRegisteredVoter === "yes"
        ? 1
        : isRegisteredVoter === "no"
        ? 0
        : null;

    const request = pool.request();
    request.input("VoterId", sql.Int, user.id);
    request.input("Message", sql.NVarChar(1000), text);
    request.input("Rating", sql.Int, rating ?? candidateSatisfaction ?? null);
    request.input("IsRegisteredVoter", sql.Bit, isRegBool);
    request.input(
      "CandidateSatisfaction",
      sql.Int,
      candidateSatisfaction ?? null
    );
    request.input("ProcessTrust", sql.Int, processTrust ?? null);
    request.input("Motivation", sql.NVarChar(20), motivation || null);
    request.output("FeedbackId", sql.Int);

    // sp_AddFeedback will do the actual insert
    const result = await request.execute("sp_AddFeedback");

    res.json({
      success: true,
      FeedbackId: result.output.FeedbackId,
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    console.error("❌ Error submitting feedback:", err);

    // If stored procedure raised a custom error
    if (
      typeof err.message === "string" &&
      err.message.toLowerCase().includes("already submitted")
    ) {
      return res
        .status(400)
        .json({ error: "Feedback already submitted for this voter." });
    }

    res
      .status(500)
      .json({ error: err.message || "Failed to submit feedback" });
  }
});

/* ===========================================================
   GET /api/feedback/me
   -> Used by frontend to know if this user already submitted
   =========================================================== */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.id;
    const result = await pool
      .request()
      .input("VoterId", sql.Int, voterId)
      .query(
        "SELECT TOP 1 FeedbackId, CreatedAt FROM dbo.Feedback WHERE VoterId = @VoterId;"
      );

    if (result.recordset.length === 0) {
      return res.json({ hasFeedback: false });
    }

    res.json({
      hasFeedback: true,
      feedback: result.recordset[0],
    });
  } catch (err) {
    console.error("❌ Error checking feedback:", err);
    res.status(500).json({ error: "Failed to check feedback" });
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
        f.IsRegisteredVoter,
        f.CandidateSatisfaction,
        f.ProcessTrust,
        f.Motivation,
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
