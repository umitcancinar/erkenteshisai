const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware, healthController.addEntry);
router.get('/', authMiddleware, healthController.getEntries);

module.exports = router;
