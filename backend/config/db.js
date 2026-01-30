// backend/config/db.js
const sql = require("mssql");

const config = {
  // Use the same server name you see in SSMS: here it's localhost
  server: process.env.DB_SERVER || "localhost",

  // DO NOT force a port here; let the driver / SQL Browser resolve it
  user: process.env.DB_USER || "voting_user",
  password: process.env.DB_PASSWORD || "StrongPassword123!",
  database: process.env.DB_NAME || "DigitalVotingDB",

  options: {
    encrypt: false,              // fine for local / dev
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

console.log("ENV CHECK:", config.server, config.database);

const pool = new sql.ConnectionPool(config);

pool
  .connect()
  .then(() => {
    console.log("✅ SQL Server connected");
  })
  .catch((err) => {
    console.error("❌ SQL Server connection failed:", err.message);
  });

module.exports = pool;
