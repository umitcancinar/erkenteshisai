const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/auth');
const multer = require('multer');

// Configure multer for memory storage (we will pass base64 to Gemini directly)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.post('/chat', aiController.chat);
router.post('/analyze-image', authMiddleware, upload.single('image'), aiController.analyzeImage);
router.post('/generate-report', authMiddleware, aiController.generateReport);
router.get('/reports', authMiddleware, aiController.getReports);

module.exports = router;
