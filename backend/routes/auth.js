const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sql = require("mssql");
const router = express.Router();
const pool = require("../config/db");

// ✅ REGISTER
router.post("/register", async (req, res) => {
  const { full_name, student_id, email, phone, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const request = pool.request();

    request.input("FullName", sql.NVarChar, full_name);
    request.input("StudentId", sql.NVarChar, student_id);
    request.input("Email", sql.NVarChar, email);
    request.input("Phone", sql.NVarChar, phone);
    request.input("PasswordHash", sql.NVarChar, hashed);

    await request.query(`
      INSERT INTO Profiles (FullName, StudentId, Email, Phone, PasswordHash, IsVerified)
      VALUES (@FullName, @StudentId, @Email, @Phone, @PasswordHash, 1)
    `);

    res.json({ message: "Registration successful" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const request = pool.request();
    request.input("Email", sql.NVarChar, email);

    const result = await request.query(`SELECT * FROM Profiles WHERE Email = @Email`);
    if (result.recordset.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.Id, email: user.Email, fullName: user.FullName },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.Id,
        fullName: user.FullName,
        email: user.Email,
        studentId: user.StudentId,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});

module.exports = router;
