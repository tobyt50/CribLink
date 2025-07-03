const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false } // Required for Render or other managed hosts
    : false,                       // No SSL locally
});

pool.on('connect', () => {
  console.log('🟢 Connected to PostgreSQL');
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
