const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_w2nC6dTXgxlJ@ep-damp-field-amjlge7k-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function run() {
  try {
    console.log('Connecting to DB...');
    await pool.query('ALTER TABLE health_entries ADD COLUMN IF NOT EXISTS mood_score INTEGER');
    console.log('Database updated successfully with mood_score');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    await pool.end();
  }
}

run();
