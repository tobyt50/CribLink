const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // 👈 Needed for Render and other cloud DBs
  },
});

pool.on('connect', () => {
  console.log('🟢 Connected to PostgreSQL');
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
