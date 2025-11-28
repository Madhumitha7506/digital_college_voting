const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// 🗳️ Submit votes
router.post("/", authenticateToken, async (req, res) => {
  const { votes } = req.body; // Array of { position, candidateId }
  const userId = req.user.id;

  if (!Array.isArray(votes)) {
    return res.status(400).json({ error: "Votes must be an array" });
  }

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const request = new sql.Request(transaction);
    request.input("userId", sql.Int, userId);

    // Check if user already voted
    const checkResult = await request.query(
      "SELECT HasVoted FROM Profiles WHERE Id = @userId"
    );

    if (checkResult.recordset[0]?.HasVoted) {
      await transaction.rollback();
      return res.status(403).json({ error: "You have already voted" });
    }

    // Insert votes
    for (const vote of votes) {
      const voteReq = new sql.Request(transaction);
      voteReq.input("userId", sql.Int, userId);
      voteReq.input("candidateId", sql.Int, vote.candidateId);
      voteReq.input("position", sql.NVarChar, vote.position);

      await voteReq.query(`
        INSERT INTO Votes (UserId, CandidateId, Position, VotedAt)
        VALUES (@userId, @candidateId, @position, GETDATE())
      `);
    }

    // Update user status
    const updateReq = new sql.Request(transaction);
    updateReq.input("userId", sql.Int, userId);
    await updateReq.query("UPDATE Profiles SET HasVoted = 1 WHERE Id = @userId");

    await transaction.commit();
    res.json({ message: "Votes submitted successfully" });
  } catch (error) {
    console.error("❌ Voting error:", error);
    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }
    res.status(500).json({ error: "Failed to submit votes: " + error.message });
  }
});

// 📊 Get vote results
router.get("/results", authenticateToken, async (req, res) => {
  try {
    const result = await pool
      .request()
      .query(`
        SELECT 
          c.Id AS CandidateId,
          c.Name,
          c.Position,
          c.Manifesto,
          c.PhotoUrl,
          COUNT(v.Id) AS VoteCount
        FROM Candidates c
        LEFT JOIN Votes v ON c.Id = v.CandidateId
        GROUP BY c.Id, c.Name, c.Position, c.Manifesto, c.PhotoUrl
        ORDER BY c.Position, VoteCount DESC;
      `);

    if (result.recordset.length === 0) {
      return res.json([]);
    }

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error fetching results:", error);
    res.status(500).json({ error: "Failed to fetch results: " + error.message });
  }
});


// ✅ Check if user already voted
router.get("/check-voted", authenticateToken, async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("userId", sql.Int, req.user.id)
      .query("SELECT HasVoted FROM Profiles WHERE Id = @userId");

    res.json({ hasVoted: result.recordset[0]?.HasVoted });
  } catch (error) {
    console.error("❌ Error checking vote status:", error);
    res.status(500).json({ error: "Failed to check vote status" });
  }
});

module.exports = router;
