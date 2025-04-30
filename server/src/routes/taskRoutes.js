const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Basic routes for tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Tasks API', tasks: [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    res.status(201).json({ message: 'Task created', task: req.body });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 