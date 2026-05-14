const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, height, weight, gender FROM users WHERE id = $1', [req.user.userId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Profil bilgileri alınamadı.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { height, weight, gender } = req.body;
        await db.query(
            'UPDATE users SET height = $1, weight = $2, gender = $3 WHERE id = $4',
            [height, weight, gender, req.user.userId]
        );
        res.json({ message: 'Profil başarıyla güncellendi.' });
    } catch (err) {
        res.status(500).json({ error: 'Profil güncellenemedi.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mevcut şifre hatalı.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.userId]);
        res.json({ message: 'Şifre başarıyla değiştirildi.' });
    } catch (err) {
        res.status(500).json({ error: 'Şifre değiştirilemedi.' });
    }
};
