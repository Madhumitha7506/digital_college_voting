const sql = require("mssql");
const path = require("path");

// ✅ Load environment variables from the project root (.env)
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Optional: check that variables are loaded
console.log("ENV CHECK:", process.env.DB_SERVER, process.env.DB_DATABASE);

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // e.g. "10.0.0.99"
  database: process.env.DB_DATABASE, // e.g. "DigitalVotingDB"
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // true for Azure
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);

// Connect immediately when this module is imported
pool.connect()
  .then(() => {
    console.log(`✅ Connected to SQL Server: ${process.env.DB_DATABASE}`);
  })
  .catch((err) => {
    console.error("❌ SQL Server connection failed:", err.message);
  });

// Optional quick test query to verify connectivity
pool.on("connect", async () => {
  try {
    const result = await pool.request().query("SELECT 1 AS ok");
    console.log("🔗 Test Query Result:", result.recordset);
  } catch (error) {
    console.error("⚠️ Test query failed:", error.message);
  }
});

module.exports = pool;
