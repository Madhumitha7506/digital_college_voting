const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   ADD Feedback
   Calls: sp_AddFeedback
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { Message, Rating } = req.body;
    const userId = req.user.id;

    const request = pool.request();
    request.input("VoterId", sql.Int, userId);
    request.input("Message", sql.NVarChar, Message);
    request.input("Rating", sql.Int, Rating || null);
    request.output("FeedbackId", sql.Int);

    const result = await request.execute("sp_AddFeedback");
    res.json({
      success: true,
      FeedbackId: result.output.FeedbackId,
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    console.error("❌ Error adding feedback:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

/* ===========================================================
   GET Feedback
   Calls: sp_GetFeedback
   =========================================================== */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.execute("sp_GetFeedback");
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching feedback:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

module.exports = router;
