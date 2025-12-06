// backend/routes/votes.js

const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   CAST votes (one per position)
   Expects: { votes: [{ position, candidateId }, ...] }
   Calls sp_CastVote for each
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { votes } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: "No votes provided" });
    }

    const savedVotes = [];

    for (const v of votes) {
      if (!v || !v.candidateId) {
        continue;
      }

      const request = pool.request();
      request.input("VoterId", sql.Int, userId);
      request.input("CandidateId", sql.Int, v.candidateId);
      request.output("VoteId", sql.Int);

      const result = await request.execute("sp_CastVote");

      savedVotes.push({
        position: v.position,
        candidateId: v.candidateId,
        voteId: result.output.VoteId,
      });
    }

    res.json({
      success: true,
      message: "Votes recorded successfully",
      votes: savedVotes,
    });
  } catch (err) {
    console.error("❌ Error casting votes:", err);
    // If sp_CastVote RAISERRORs, the message comes in err.message
    res.status(400).json({ error: err.message || "Failed to cast votes" });
  }
});

/* ===========================================================
   LIVE RESULTS (with counts)
   Calls: sp_GetResults
   =========================================================== */
router.get("/results", authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.execute("sp_GetResults");
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching results:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

module.exports = router;
