const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

/* ===========================================================
   Determine user role
   =========================================================== */
function getRoleFromVoter(voter) {
  // Change this email if your admin email is different
  if (voter.Email && voter.Email.toLowerCase() === "admin@demo.com") {
    return "admin";
  }
  return "voter";
}

/* ===========================================================
   Sign JWT Token
   =========================================================== */
function signToken(voter) {
  const role = getRoleFromVoter(voter);

  return jwt.sign(
    {
      id: voter.VoterId,
      name: voter.FullName,
      email: voter.Email,
      gender: voter.Gender,
      studentId: voter.StudentId,
      role: role,
    },
    process.env.JWT_SECRET || "changeme",
    {
      expiresIn: "77d", // safer than 160d
    }
  );
}

/* ===========================================================
   REGISTER USER
   Body: { name, email, password, phone, gender, student_id }
   =========================================================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, gender, student_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    // Check if email exists
    const check = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .query("SELECT TOP 1 VoterId FROM dbo.Voters WHERE Email = @Email");

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("FullName", sql.NVarChar, name)
      .input("Email", sql.NVarChar, email)
      .input("PasswordHash", sql.NVarChar, passwordHash)
      .input("Phone", sql.NVarChar, phone || null)
      .input("Gender", sql.NVarChar, gender || null)
      .input("StudentId", sql.NVarChar, student_id || null)
      .query(`
        INSERT INTO dbo.Voters 
        (FullName, Email, PasswordHash, Phone, Gender, StudentId, IsVerified, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@FullName, @Email, @PasswordHash, @Phone, @Gender, @StudentId, 1, SYSDATETIME());
      `);

    const voter = result.recordset[0];

    res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: voter.VoterId,
        fullName: voter.FullName,
        email: voter.Email,
        gender: voter.Gender,
        studentId: voter.StudentId,
        phone: voter.Phone,
        role: getRoleFromVoter(voter),
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ===========================================================
   LOGIN
   Body: { email, password }
   =========================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool
      .request()
      .input("Email", sql.NVarChar, email)
      .query(`
        SELECT VoterId, FullName, Email, PasswordHash, Gender, StudentId, Phone
        FROM dbo.Voters
        WHERE Email = @Email;
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const voter = result.recordset[0];

    const match = await bcrypt.compare(password, voter.PasswordHash || "");
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(voter);
    const role = getRoleFromVoter(voter);

    res.json({
      success: true,
      token,
      user: {
        id: voter.VoterId,
        fullName: voter.FullName,
        email: voter.Email,
        gender: voter.Gender,
        studentId: voter.StudentId,
        phone: voter.Phone,
        role: role,   // 🔥 IMPORTANT
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
