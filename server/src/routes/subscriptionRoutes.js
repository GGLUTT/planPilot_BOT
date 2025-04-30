const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Basic routes for subscription
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Subscription API', subscription: { plan: 'free' } });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Subscription upgraded', plan: req.body.plan });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 