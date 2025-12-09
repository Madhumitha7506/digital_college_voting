// backend/routes/votes.js
const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   CAST a vote
   Calls: sp_CastVote
   Emits: "vote_cast" via socket.io
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { CandidateId } = req.body;
    const userId = req.user.id;

    const request = pool.request();
    request.input("VoterId", sql.Int, userId);
    request.input("CandidateId", sql.Int, CandidateId);
    request.output("VoteId", sql.Int);

    const result = await request.execute("sp_CastVote");

    // 🔔 Fetch candidate info for notification
    const candRes = await pool
      .request()
      .input("CandidateId", sql.Int, CandidateId)
      .query(
        `SELECT CandidateId, Name, Position, Gender
         FROM dbo.Candidates
         WHERE CandidateId = @CandidateId`
      );

    const candidate = candRes.recordset[0];

    // 🔔 Emit socket event so admin sees live notification
    const io = req.app.get("io");
    if (io && candidate) {
      io.emit("vote_cast", {
        candidateId: candidate.CandidateId,
        candidateName: candidate.Name,
        position: candidate.Position,
        gender: candidate.Gender,
        voterId: userId,
        time: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      VoteId: result.output.VoteId,
      message: "Vote recorded successfully",
    });
  } catch (err) {
    console.error("❌ Error casting vote:", err);
    res.status(500).json({ error: err.message || "Failed to cast vote" });
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
