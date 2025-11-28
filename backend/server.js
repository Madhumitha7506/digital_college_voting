const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// ✅ Initialize DB connection
require("./config/db");

// ✅ Import routes
const authRoutes = require("./routes/auth");
const candidateRoutes = require("./routes/candidates");
const voteRoutes = require("./routes/votes");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed frontend origins (React dev servers)
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:8080", // fallback
  "http://localhost:8081", // alternate port
  process.env.FRONTEND_URL,
].filter(Boolean);

// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server and DB are running fine." });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
