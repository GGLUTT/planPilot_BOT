require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

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
     origin: process.env.CLIENT_URL || 'https://gglutt.github.io/planPilot_BOT'
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

// Ensure data directory exists
const ensureDataDirExists = async () => {
  try {
    const dataDir = path.join(__dirname, '../data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Ensure users.json and tasks.json exist
    const usersPath = path.join(dataDir, 'users.json');
    const tasksPath = path.join(dataDir, 'tasks.json');
    
    try {
      await fs.access(usersPath);
    } catch (error) {
      await fs.writeFile(usersPath, '[]', 'utf8');
      console.log('Created users.json file');
    }
    
    try {
      await fs.access(tasksPath);
    } catch (error) {
      await fs.writeFile(tasksPath, '[]', 'utf8');
      console.log('Created tasks.json file');
    }
    
    console.log('Data directory and files are ready');
  } catch (error) {
    console.error('Error creating data directory or files:', error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  await ensureDataDirExists();
  
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Initialize Telegram bot
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const bot = initBot();
        if (bot) {
          console.log('Telegram bot initialized');
        } else {
          console.warn('Failed to initialize Telegram bot');
        }
      } catch (error) {
        console.error('Error during bot initialization:', error);
      }
    } else {
      console.warn('TELEGRAM_BOT_TOKEN not found. Telegram bot not initialized.');
    }
  });
  
  // Обробка зупинки сервера
  const handleShutdown = async () => {
    console.log('Shutting down server...');
    
    // Отримуємо екземпляр бота і зупиняємо поллінг
    const bot = telegramService.getBot();
    if (bot) {
      try {
        console.log('Stopping Telegram bot polling...');
        await bot.stopPolling();
        console.log('Telegram bot polling stopped');
      } catch (error) {
        console.error('Error stopping Telegram bot:', error);
      }
    }
    
    // Закриваємо HTTP сервер
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
    
    // На випадок, якщо сервер не закрився нормально
    setTimeout(() => {
      console.error('Forced exit');
      process.exit(1);
    }, 5000);
  };
  
  // Підписуємось на події зупинки процесу
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
};

startServer(); 