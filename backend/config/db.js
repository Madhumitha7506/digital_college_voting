const sql = require("mssql");
require("dotenv").config();

console.log("DB_SERVER =", process.env.DB_SERVER);

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);

pool
  .connect()
  .then(() => {
    console.log("✅ Connected to SQL Server:", process.env.DB_DATABASE);
  })
  .catch((err) => {
    console.error("❌ SQL Server connection failed:", err.message);
  });

module.exports = pool;
