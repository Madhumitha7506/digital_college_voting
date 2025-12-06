// backend/middleware/auth.js (or backend/auth.js if you use that path)

const jwt = require("jsonwebtoken");

// Use the same secret everywhere (login + middleware)
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT verify error:", err.message);
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // user is the payload from jwt.sign(...)
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
