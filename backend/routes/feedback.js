const express = require("express");
const sql = require("mssql");
const { authenticateToken } = require("../middleware/auth");
const pool = require("../config/db");
const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  const { rating, suggestion } = req.body;
  const userId = req.user.id;

  try {
    await pool.request()
      .input("userId", sql.Int, userId)
      .input("rating", sql.Int, rating)
      .input("suggestion", sql.NVarChar, suggestion || null)
      .query(`
        INSERT INTO Feedback (UserId, Rating, Suggestion, CreatedAt)
        VALUES (@userId, @rating, @suggestion, GETDATE())
      `);

    res.json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("❌ Feedback error:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

module.exports = router;
