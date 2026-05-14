const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

router.get('/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.get('/stats', authMiddleware, adminMiddleware, adminController.getStats);
router.get('/logs', authMiddleware, adminMiddleware, adminController.getLogs);

module.exports = router;
