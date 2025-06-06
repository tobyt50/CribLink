const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('🟢 Connected to PostgreSQL');
});

// ✅ Export the pool AND the query function
module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
};
