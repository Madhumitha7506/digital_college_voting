const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/overview", authenticateToken, async (req, res) => {
  try {
    const [voters, candidates, votes] = await Promise.all([
      pool.request().query("SELECT COUNT(*) AS total FROM Profiles"),
      pool.request().query("SELECT COUNT(*) AS total FROM Candidates"),
      pool.request().query("SELECT COUNT(*) AS total FROM Votes"),
    ]);

    res.json({
      totalVoters: voters.recordset[0].total,
      totalCandidates: candidates.recordset[0].total,
      totalVotes: votes.recordset[0].total,
    });
  } catch (err) {
    console.error("❌ Admin overview error:", err);
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

module.exports = router;
