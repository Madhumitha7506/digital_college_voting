// backend/routes/candidates.js

const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* ===========================================================
   GET all candidates
   Calls: sp_GetCandidates
   =========================================================== */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const request = pool.request();
    request.input("OnlyActive", sql.Bit, 1);

    const result = await request.execute("sp_GetCandidates");

    // sp_GetCandidates returns: Id, Name, Position, Gender, Manifesto, PhotoUrl...
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching candidates:", err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

/* ===========================================================
   POST add candidate
   Calls: sp_AddCandidate
   =========================================================== */
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { Name, Position, Gender, Manifesto, PhotoUrl, IsActive } = req.body;

    if (!Name || !Position) {
      return res
        .status(400)
        .json({ error: "Name and Position are required" });
    }

    const request = pool.request();
    request.input("Name", sql.NVarChar(200), Name);
    request.input("Position", sql.NVarChar(100), Position);
    request.input("Gender", sql.NVarChar(10), Gender || null);
    request.input("Manifesto", sql.NVarChar(sql.MAX), Manifesto || null);
    request.input("PhotoUrl", sql.NVarChar(500), PhotoUrl || null);
    request.input("IsActive", sql.Bit, IsActive !== undefined ? IsActive : 1);
    request.output("CandidateId", sql.Int);

    const result = await request.execute("sp_AddCandidate");

    res.json({
      success: true,
      CandidateId: result.output.CandidateId,
    });
  } catch (err) {
    console.error("❌ Error adding candidate:", err);
    res.status(500).json({ error: "Failed to add candidate" });
  }
});

/* ===========================================================
   PUT update candidate
   Calls: sp_UpdateCandidate
   =========================================================== */
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Position, Gender, Manifesto, PhotoUrl, IsActive } = req.body;

    if (!Name || !Position) {
      return res
        .status(400)
        .json({ error: "Name and Position are required" });
    }

    const request = pool.request();
    request.input("CandidateId", sql.Int, Number(id));
    request.input("Name", sql.NVarChar(200), Name);
    request.input("Position", sql.NVarChar(100), Position);
    request.input("Gender", sql.NVarChar(10), Gender || null);
    request.input("Manifesto", sql.NVarChar(sql.MAX), Manifesto || null);
    request.input("PhotoUrl", sql.NVarChar(500), PhotoUrl || null);
    request.input("IsActive", sql.Bit, IsActive !== undefined ? IsActive : 1);

    await request.execute("sp_UpdateCandidate");

    res.json({ success: true, message: "Candidate updated successfully" });
  } catch (err) {
    console.error("❌ Error updating candidate:", err);
    res.status(500).json({ error: "Failed to update candidate" });
  }
});

/* ===========================================================
   DELETE candidate
   Calls: sp_DeleteCandidate
   =========================================================== */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const request = pool.request();
    request.input("CandidateId", sql.Int, Number(id));

    await request.execute("sp_DeleteCandidate");

    res.json({ success: true, message: "Candidate deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting candidate:", err);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
});

module.exports = router;
