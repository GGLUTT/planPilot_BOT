const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Basic routes for notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Notifications API', notifications: [] });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/settings', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Notification settings updated', settings: req.body });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 