// backend/routes/admin.js
const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   Helper: ensure SystemSettings table exists + seed default
   =========================================================== */
async function ensureSystemSettingsTable() {
  await pool.request().query(`
    IF OBJECT_ID('dbo.SystemSettings', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SystemSettings (
        SettingKey   NVARCHAR(100) NOT NULL PRIMARY KEY,
        SettingValue NVARCHAR(4000) NULL
      );

      -- Seed defaults
      INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
      VALUES ('ResultsPublished', 'false'),
             ('ResultsPublishedAt', NULL);
    END;
  `);
}

/* ===========================================================
   GET /api/admin/results-status
   -> Everyone logged in (admin + voters) can read status
   =========================================================== */
router.get("/results-status", authenticateToken, async (req, res) => {
  try {
    await ensureSystemSettingsTable();

    const result = await pool.request().query(`
      SELECT
        MAX(CASE WHEN SettingKey = 'ResultsPublished' THEN SettingValue END) AS ResultsPublished,
        MAX(CASE WHEN SettingKey = 'ResultsPublishedAt' THEN SettingValue END) AS ResultsPublishedAt
      FROM dbo.SystemSettings;
    `);

    const row = result.recordset[0] || {};
    const published = (row.ResultsPublished || "").toLowerCase() === "true";
    const publishedAt = row.ResultsPublishedAt || null;

    res.json({ published, publishedAt });
  } catch (err) {
    console.error("❌ Error loading results status:", err);
    res.status(500).json({ error: "Failed to load results status" });
  }
});

/* ===========================================================
   POST /api/admin/publish-results  (ADMIN ONLY)
   -> Mark results as published + broadcast notification
   =========================================================== */
router.post(
  "/publish-results",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await ensureSystemSettingsTable();

      // Get ISO formatted timestamp (YYYY-MM-DDThh:mm:ss)
      const nowResult = await pool
        .request()
        .query(`SELECT CONVERT(NVARCHAR(50), GETDATE(), 126) AS NowStr;`);
      const nowStr = nowResult.recordset[0].NowStr;

      // Upsert ResultsPublished = 'true'
      await pool.request().query(`
        IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = 'ResultsPublished')
          UPDATE dbo.SystemSettings
          SET SettingValue = 'true'
          WHERE SettingKey = 'ResultsPublished';
        ELSE
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
          VALUES ('ResultsPublished', 'true');
      `);

      // Upsert ResultsPublishedAt = timestamp
      const r2 = pool.request();
      r2.input("NowStr", sql.NVarChar, nowStr);
      await r2.query(`
        IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = 'ResultsPublishedAt')
          UPDATE dbo.SystemSettings
          SET SettingValue = @NowStr
          WHERE SettingKey = 'ResultsPublishedAt';
        ELSE
          INSERT INTO dbo.SystemSettings (SettingKey, SettingValue)
          VALUES ('ResultsPublishedAt', @NowStr);
      `);

      // Emit a Socket.IO notification to all clients
      const io = req.app.get("io");
      if (io) {
        io.emit("notification", {
          type: "results_published",
          title: "Election Results Published",
          message:
            "The Admin has officially published the election results. Please check the Results tab.",
          publishedAt: nowStr,
        });
      }

      res.json({
        success: true,
        published: true,
        publishedAt: nowStr,
        message: "Results published successfully",
      });
    } catch (err) {
      console.error("❌ Error publishing results:", err);
      res.status(500).json({ error: "Failed to publish results" });
    }
  }
);

/* ===========================================================
   POST /api/admin/unpublish-results  (ADMIN ONLY)
   -> Hide results from students again
   =========================================================== */
router.post(
  "/unpublish-results",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await ensureSystemSettingsTable();

      await pool.request().query(`
        UPDATE dbo.SystemSettings
          SET SettingValue = 'false'
        WHERE SettingKey = 'ResultsPublished';

        UPDATE dbo.SystemSettings
          SET SettingValue = NULL
        WHERE SettingKey = 'ResultsPublishedAt';
      `);

      // Optional socket notification for demo
      const io = req.app.get("io");
      if (io) {
        io.emit("notification", {
          type: "results_unpublished",
          title: "Results Hidden",
          message:
            "The Admin has hidden the election results. Students will no longer see the winners.",
        });
      }

      res.json({
        success: true,
        published: false,
        message: "Results have been unpublished / hidden",
      });
    } catch (err) {
      console.error("❌ Error unpublishing results:", err);
      res.status(500).json({ error: "Failed to unpublish results" });
    }
  }
);

/* ===========================================================
   GET /api/admin/stats  (ADMIN ONLY)
   -> Overall election stats for Admin dashboard
   =========================================================== */
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Only count verified non-admin voters
    const votersResult = await pool.request().query(`
      SELECT COUNT(*) AS TotalVoters 
      FROM dbo.Voters
      WHERE IsVerified = 1
        AND LOWER(Email) <> 'admin@demo.com';
    `);

    const candidatesResult = await pool
      .request()
      .query(`SELECT COUNT(*) AS TotalCandidates FROM dbo.Candidates;`);

    const votesResult = await pool
      .request()
      .query(`SELECT COUNT(*) AS TotalVotes FROM dbo.Votes;`);

    const byPositionResult = await pool.request().query(`
      SELECT 
        c.Position,
        COUNT(*) AS TotalVotes
      FROM dbo.Votes v
      INNER JOIN dbo.Candidates c ON v.CandidateId = c.CandidateId
      GROUP BY c.Position
      ORDER BY c.Position;
    `);

    const byGenderResult = await pool.request().query(`
      SELECT 
        c.Gender,
        COUNT(*) AS TotalVotes
      FROM dbo.Votes v
      INNER JOIN dbo.Candidates c ON v.CandidateId = c.CandidateId
      GROUP BY c.Gender
      ORDER BY c.Gender;
    `);

    const totalVoters = votersResult.recordset[0]?.TotalVoters || 0;
    const totalCandidates = candidatesResult.recordset[0]?.TotalCandidates || 0;
    const totalVotes = votesResult.recordset[0]?.TotalVotes || 0;

    // Turnout = how many votes / how many registered voters
    // (for demo this might be >100% if same student can vote multiple times)
    const turnoutPercent =
      totalVoters === 0 ? 0 : Math.round((totalVotes / totalVoters) * 100);

    res.json({
      totalVoters,
      totalCandidates,
      totalVotes,
      turnoutPercent,
      votesByPosition: byPositionResult.recordset,
      votesByGender: byGenderResult.recordset,
    });
  } catch (err) {
    console.error("❌ Admin stats error:", err);
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

/* ===========================================================
   GET /api/admin/report/turnout   (ADMIN ONLY)
   -> Download turnout & position summary as CSV
   =========================================================== */
router.get(
  "/report/turnout",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const votersResult = await pool.request().query(`
        SELECT COUNT(*) AS TotalVoters 
        FROM dbo.Voters
        WHERE IsVerified = 1
          AND LOWER(Email) <> 'admin@demo.com';
      `);

      const candidatesResult = await pool
        .request()
        .query(`SELECT COUNT(*) AS TotalCandidates FROM dbo.Candidates;`);

      const votesResult = await pool
        .request()
        .query(`SELECT COUNT(*) AS TotalVotes FROM dbo.Votes;`);

      const byPositionResult = await pool.request().query(`
        SELECT 
          c.Position,
          COUNT(*) AS TotalVotes
        FROM dbo.Votes v
        INNER JOIN dbo.Candidates c ON v.CandidateId = c.CandidateId
        GROUP BY c.Position
        ORDER BY c.Position;
      `);

      const totalVoters = votersResult.recordset[0]?.TotalVoters || 0;
      const totalCandidates = candidatesResult.recordset[0]?.TotalCandidates || 0;
      const totalVotes = votesResult.recordset[0]?.TotalVotes || 0;
      const turnoutPercent =
        totalVoters === 0 ? 0 : Math.round((totalVotes / totalVoters) * 100);

      // Build CSV
      let csv = "";
      csv += "Metric,Value\r\n";
      csv += `Total voters,${totalVoters}\r\n`;
      csv += `Total candidates,${totalCandidates}\r\n`;
      csv += `Total votes cast,${totalVotes}\r\n`;
      csv += `Turnout (%),${turnoutPercent}\r\n`;
      csv += "\r\n";
      csv += "Position,Votes\r\n";
      byPositionResult.recordset.forEach((row) => {
        csv += `${row.Position},${row.TotalVotes}\r\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="turnout_report.csv"'
      );
      res.send(csv);
    } catch (err) {
      console.error("❌ Turnout report error:", err);
      res.status(500).send("Failed to generate turnout report");
    }
  }
);

/* ===========================================================
   GET /api/admin/report/candidates   (ADMIN ONLY)
   -> Download candidate-wise vote counts as CSV
   =========================================================== */
router.get(
  "/report/candidates",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT 
          c.CandidateId,
          c.Name,
          c.Position,
          c.Gender,
          ISNULL(c.Manifesto, '') AS Manifesto,
          COUNT(v.VoteId) AS Votes
        FROM dbo.Candidates c
        LEFT JOIN dbo.Votes v ON c.CandidateId = v.CandidateId
        GROUP BY 
          c.CandidateId, c.Name, c.Position, c.Gender, c.Manifesto
        ORDER BY c.Position, Votes DESC, c.Name;
      `);

      let csv = "CandidateId,Name,Position,Gender,Votes,Manifesto\r\n";
      result.recordset.forEach((row) => {
        const safeManifesto = (row.Manifesto || "").replace(/,/g, " ");
        csv += `${row.CandidateId},${row.Name},${row.Position},${row.Gender},${row.Votes},${safeManifesto}\r\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="candidate_report.csv"'
      );
      res.send(csv);
    } catch (err) {
      console.error("❌ Candidate report error:", err);
      res.status(500).send("Failed to generate candidate report");
    }
  }
);

module.exports = router;
