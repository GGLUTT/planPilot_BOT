const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.post('/generate-code', protect, telegramController.generateConnectionCode);
router.get('/status', protect, telegramController.getConnectionStatus);
router.post('/disconnect', protect, telegramController.disconnectTelegram);
router.post('/notifications', protect, telegramController.toggleNotifications);
router.post('/test-notification', protect, telegramController.sendTestNotification);

// Public route for Telegram webhook
router.post('/webhook', telegramController.handleWebhook);

module.exports = router; 