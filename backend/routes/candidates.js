// routes/candidates.js - CORRECTED COLUMN NAMES

const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/* ====================================
   GET ALL ACTIVE CANDIDATES
   ✅ CORRECTED: Using actual DB column names
   ==================================== */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        CandidateId,
        Name,
        Position,
        Gender,
        Manifesto,
        PhotoUrl,
        IsActive,
        CreatedAt
      FROM dbo.Candidates
      WHERE IsActive = 1
      ORDER BY Position, Name
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Fetch candidates error:", err);
    res.status(500).json({ 
      error: "Failed to fetch candidates",
      details: err.message 
    });
  }
});

/* ====================================
   GET SINGLE CANDIDATE BY ID
   ==================================== */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);

    const result = await pool
      .request()
      .input("CandidateId", sql.Int, candidateId)
      .query(`
        SELECT 
          CandidateId,
          Name,
          Position,
          Gender,
          Manifesto,
          PhotoUrl,
          IsActive,
          CreatedAt
        FROM dbo.Candidates
        WHERE CandidateId = @CandidateId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Fetch candidate error:", err);
    res.status(500).json({ 
      error: "Failed to fetch candidate",
      details: err.message 
    });
  }
});

module.exports = router;