const db = require('../config/db');

exports.getUsers = async (req, res) => {
    try {
        const users = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ error: 'Kullanıcılar getirilirken hata oluştu.' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const userCount = await db.query('SELECT COUNT(*) FROM users');
        const entryCount = await db.query('SELECT COUNT(*) FROM health_entries');
        const analysisCount = await db.query('SELECT COUNT(*) FROM analyses');
        
        res.json({
            users: userCount.rows[0].count,
            entries: entryCount.rows[0].count,
            analyses: analysisCount.rows[0].count
        });
    } catch (err) {
        res.status(500).json({ error: 'İstatistikler getirilirken hata oluştu.' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        // Simple log fetch from analyses table as a proxy for activity
        const logs = await db.query(`
            SELECT a.id, u.username, a.type, a.created_at 
            FROM analyses a 
            JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC LIMIT 50
        `);
        res.json(logs.rows);
    } catch (err) {
        res.status(500).json({ error: 'Loglar getirilirken hata oluştu.' });
    }
};
