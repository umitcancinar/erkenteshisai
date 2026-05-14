const bcrypt = require('bcrypt');
const db = require('../config/db');
require('dotenv').config({ path: '../.env' });

const createAdmin = async () => {
    const username = 'admin';
    const email = 'admin@erkenteshis.ai';
    const password = 'admin123_apple_style';

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            [username, email, passwordHash, 'admin']
        );

        console.log('Admin user created successfully:');
        console.log('Email: admin@erkenteshis.ai');
        console.log('Password: admin123_apple_style');
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();
