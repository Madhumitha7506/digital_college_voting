const express = require("express");
const sql = require("mssql");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/* GET ALL PENDING KYC */
router.get("/kyc", authenticateToken, requireAdmin, async (req, res) => {
  const result = await pool.request().query(`
    SELECT VoterId, FullName, AadhaarNumber, PANNumber, ElectionId
    FROM dbo.Voters
    WHERE IsKycVerified=0 AND IsKycRejected=0
  `);
  res.json(result.recordset);
});

/* APPROVE */
router.put("/kyc/approve/:id", authenticateToken, requireAdmin, async (req, res) => {
  await pool.request()
    .input("VoterId", sql.Int, req.params.id)
    .query(`
      UPDATE dbo.Voters
      SET IsKycVerified=1,
          KycVerifiedAt=GETDATE(),
          KycVerifiedBy='Admin'
      WHERE VoterId=@VoterId
    `);
  res.json({ success: true });
});

/* REJECT */
router.put("/kyc/reject/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { reason } = req.body;
  await pool.request()
    .input("VoterId", sql.Int, req.params.id)
    .input("Reason", sql.NVarChar(500), reason)
    .query(`
      UPDATE dbo.Voters
      SET IsKycRejected=1,
          KycRejectedReason=@Reason
      WHERE VoterId=@VoterId
    `);
  res.json({ success: true });
});

module.exports = router;