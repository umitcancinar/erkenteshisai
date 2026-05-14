const db = require('../config/db');

exports.addEntry = async (req, res) => {
  try {
    const { date, symptoms, pulse, blood_pressure, blood_sugar, body_temperature, sleep_hours, stress_level, mood_score } = req.body;
    
    const newEntry = await db.query(
      `INSERT INTO health_entries 
      (user_id, date, symptoms, pulse, blood_pressure, blood_sugar, body_temperature, sleep_hours, stress_level, mood_score) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.userId, date || new Date(), symptoms, pulse, blood_pressure, blood_sugar, body_temperature, sleep_hours, stress_level, mood_score]
    );

    res.status(201).json(newEntry.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sağlık verisi eklenirken hata oluştu.' });
  }
};

exports.getEntries = async (req, res) => {
  try {
    const entries = await db.query(
      'SELECT * FROM health_entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [req.user.userId]
    );
    res.json(entries.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sağlık verileri getirilirken hata oluştu.' });
  }
};
