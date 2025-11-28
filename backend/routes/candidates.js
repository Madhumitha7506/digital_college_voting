const express = require("express");
const sql = require("mssql");
const router = express.Router();
const pool = require("../config/db"); // your SQL Server connection pool
const { authenticateToken } = require("../middleware/auth");

// ✅ Get all candidates (grouped by position)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT Id, Name, Position, Manifesto, PhotoUrl
      FROM Candidates
      ORDER BY Position, Name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// ✅ Get candidates by position (e.g., president, secretary, etc.)
router.get("/position/:position", authenticateToken, async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("position", sql.NVarChar, req.params.position)
      .query(`
        SELECT Id, Name, Position, Manifesto, PhotoUrl
        FROM Candidates
        WHERE Position = @position
        ORDER BY Name
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error fetching candidates by position:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

module.exports = router;
