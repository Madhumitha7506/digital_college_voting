const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// 🔔 POST /api/notifications/send
// Admin sends a new notification (broadcast to all connected clients)
router.post("/send", authenticateToken, async (req, res) => {
  try {
    const { title, message } = req.body;
    const io = req.app.get("io");

    // (Optional) You could check if the user is admin here
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied — admin only." });
    }

    const notification = {
      title,
      message,
      timestamp: new Date().toISOString(),
    };

    // ✅ Emit notification to all connected clients
    io.emit("newNotification", notification);

    console.log("📢 Notification broadcasted:", notification);
    res.json({ success: true, notification });
  } catch (error) {
    console.error("❌ Notification error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

module.exports = router;
