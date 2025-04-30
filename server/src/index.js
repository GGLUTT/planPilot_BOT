require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const profileRoutes = require('./routes/profileRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Telegram bot initialization
const { initBot } = require('./services/telegramService');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
app.use(cors({
     origin: 'https://gglutt.github.io/planPilot_BOT/'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for avatars and other uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to PlanPilot API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/planpilot');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize Telegram bot
    if (process.env.TELEGRAM_BOT_TOKEN) {
      initBot();
      console.log('Telegram bot initialized');
    } else {
      console.warn('TELEGRAM_BOT_TOKEN not found. Telegram bot not initialized.');
    }
  });
};

startServer(); 