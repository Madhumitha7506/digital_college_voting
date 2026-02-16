const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   STUDENT SUBMIT FEEDBACK
   =========================================================== */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const voterId = req.user.id;

    const {
      q1_candidateSatisfaction,
      q2_keyIssue,
      q3_processTrust,
      q4_isRegisteredVoter,
      recommendation,
    } = req.body;

    // Capture IP address properly
    let ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      req.ip ||
      "";

    if (Array.isArray(ip)) ip = ip[0];
    if (ip && ip.includes("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    const request = pool.request();

    request.input("VoterId", sql.Int, voterId);
    request.input("Q1_CandidateSatisfaction", sql.Int, q1_candidateSatisfaction);
    request.input("Q2_KeyIssue", sql.NVarChar(255), q2_keyIssue);
    request.input("Q3_ProcessTrust", sql.Int, q3_processTrust);
    request.input("Q4_IsRegisteredVoter", sql.Bit, q4_isRegisteredVoter);
    request.input("Recommendation", sql.NVarChar(sql.MAX), recommendation);
    request.input("IPAddress", sql.NVarChar(50), ip);
    request.output("FeedbackId", sql.Int);

    const result = await request.execute("sp_AddFeedback");

    res.json({
      success: true,
      FeedbackId: result.output.FeedbackId,
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    console.error("Feedback submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================================================
   CHECK IF USER SUBMITTED FEEDBACK
   =========================================================== */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("VoterId", sql.Int, req.user.id)
      .query(
        "SELECT TOP 1 FeedbackId FROM dbo.Feedback WHERE VoterId = @VoterId"
      );

    res.json({
      hasFeedback: result.recordset.length > 0,
    });
  } catch (err) {
    console.error("Check feedback error:", err);
    res.status(500).json({ error: "Failed to check feedback" });
  }
});

/* ===========================================================
   ADMIN VIEW ALL FEEDBACK
   =========================================================== */
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        f.FeedbackId,
        f.VoterId,
        f.Q1_CandidateSatisfaction,
        f.Q2_KeyIssue,
        f.Q3_ProcessTrust,
        f.Q4_IsRegisteredVoter,
        f.Recommendation,
        f.IPAddress,
        ISNULL(f.IsReviewed, 0) AS IsReviewed,
        f.ReviewedBy,
        f.ReviewedAt,
        f.CreatedAt,
        v.FullName,
        v.Email,
        v.StudentId
      FROM dbo.Feedback f
      INNER JOIN dbo.Voters v ON f.VoterId = v.VoterId
      ORDER BY f.CreatedAt DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Admin fetch feedback error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================================================
   ADMIN MARK FEEDBACK AS REVIEWED
   =========================================================== */
router.put("/:id/review", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const feedbackId = parseInt(req.params.id);
    const adminName = req.user?.name || "Admin";

    await pool
      .request()
      .input("FeedbackId", sql.Int, feedbackId)
      .input("ReviewedBy", sql.NVarChar(100), adminName)
      .query(`
        UPDATE dbo.Feedback
        SET IsReviewed = 1,
            ReviewedBy = @ReviewedBy,
            ReviewedAt = SYSDATETIME()
        WHERE FeedbackId = @FeedbackId
      `);

    res.json({ success: true });
  } catch (err) {
    console.error("Mark review error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===========================================================
   FEEDBACK ANALYTICS (ADMIN)
   =========================================================== */
router.get("/analytics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // ===== Summary =====
    const summaryResult = await pool.request().query(`
      SELECT
        COUNT(*) AS TotalFeedback,
        AVG(Q1_CandidateSatisfaction) AS AvgSatisfaction,
        AVG(Q3_ProcessTrust) AS AvgTrust
      FROM dbo.Feedback
    `);

    // ===== Satisfaction Distribution =====
    const satisfactionResult = await pool.request().query(`
      SELECT 
        Q1_CandidateSatisfaction AS Rating,
        COUNT(*) AS Count
      FROM dbo.Feedback
      GROUP BY Q1_CandidateSatisfaction
      ORDER BY Rating
    `);

    // ===== Trust Distribution =====
    const trustResult = await pool.request().query(`
      SELECT 
        Q3_ProcessTrust AS Trust,
        COUNT(*) AS Count
      FROM dbo.Feedback
      GROUP BY Q3_ProcessTrust
      ORDER BY Trust
    `);

    // ===== Top Key Issues =====
    const issuesResult = await pool.request().query(`
      SELECT TOP 5
        Q2_KeyIssue,
        COUNT(*) AS Count
      FROM dbo.Feedback
      GROUP BY Q2_KeyIssue
      ORDER BY Count DESC
    `);

    res.json({
      summary: {
        ...summaryResult.recordset[0],
        SatisfactionDistribution: satisfactionResult.recordset,
        TrustDistribution: trustResult.recordset,
      },
      issues: issuesResult.recordset,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
