const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Basic routes for profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Profile API', user: req.user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Profile updated', user: { ...req.user, ...req.body } });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 