const db = require('./db');

const initDB = async () => {
  try {
    // Drop existing tables just in case, but cascade
    await db.query(`DROP TABLE IF EXISTS analyses CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS health_entries CASCADE;`);
    await db.query(`DROP TABLE IF EXISTS users CASCADE;`);

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createHealthEntriesTable = `
      CREATE TABLE IF NOT EXISTS health_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE DEFAULT CURRENT_DATE,
        symptoms TEXT,
        pulse INTEGER,
        blood_pressure VARCHAR(20),
        blood_sugar INTEGER,
        body_temperature DECIMAL(4,1),
        sleep_hours DECIMAL(4,1),
        stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createAnalysesTable = `
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createUsersTable);
    await db.query(createHealthEntriesTable);
    await db.query(createAnalysesTable);

    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

module.exports = initDB;
