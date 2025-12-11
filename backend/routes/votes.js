// backend/routes/votes.js
const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   CAST votes (supports one or many positions)
   Frontend can send:
   {
     votes: [
       { position: "president", candidateId: 1 },
       { position: "secretary", candidateId: 5 }
     ]
   }

   For backward compatibility, it also accepts:
   { CandidateId: 1 } or { candidateId: 1 }
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.id;

    let { votes } = req.body;

    // Backward-compat: if no array, treat as single vote
    if (!Array.isArray(votes)) {
      const singleId = req.body.candidateId || req.body.CandidateId;
      if (!singleId) {
        return res
          .status(400)
          .json({ error: "No candidate selected to vote for." });
      }
      votes = [{ position: null, candidateId: singleId }];
    }

    if (votes.length === 0) {
      return res
        .status(400)
        .json({ error: "No candidate selected to vote for." });
    }

    const recorded = [];

    for (const v of votes) {
      const candidateId = v.candidateId || v.CandidateId;

      if (!candidateId) {
        // Skip empty entries (shouldn't normally happen)
        continue;
      }

      const request = pool.request();
      request.input("VoterId", sql.Int, voterId);
      request.input("CandidateId", sql.Int, candidateId);
      request.output("VoteId", sql.Int);

      try {
        const result = await request.execute("sp_CastVote");

        recorded.push({
          position: v.position || null,
          candidateId,
          voteId: result.output.VoteId,
        });
      } catch (err) {
        // If SQL raised our custom RAISERROR, bubble it up nicely
        console.error(
          "❌ Error casting vote for candidate:",
          candidateId,
          err
        );
        // If one fails, stop and return that error
        return res
          .status(400)
          .json({ error: err.message || "Failed to cast vote" });
      }
    }

    res.json({
      success: true,
      votesRecorded: recorded.length,
      details: recorded,
      message: "Vote(s) recorded successfully",
    });
  } catch (err) {
    console.error("❌ Error casting votes:", err);
    res.status(500).json({ error: err.message || "Failed to cast votes" });
  }
});

/* ===========================================================
   LIVE RESULTS (with counts) - unchanged
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
