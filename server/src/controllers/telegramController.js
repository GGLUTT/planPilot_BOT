const User = require('../models/User');
const telegramService = require('../services/telegramService');

/**
 * Generate a connection code for Telegram integration
 * @route   POST /api/telegram/generate-code
 * @access  Private
 */
exports.generateConnectionCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    // Generate new connection code
    const code = await user.generateTelegramCode();
    
    res.json({
      success: true,
      code,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Error generating Telegram connection code:', error);
    res.status(500).json({ message: 'Помилка сервера при генерації коду', error: error.message });
  }
};

/**
 * Check Telegram connection status
 * @route   GET /api/telegram/status
 * @access  Private
 */
exports.getConnectionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    res.json({
      isConnected: user.telegram.isConnected,
      username: user.telegram.username,
      notificationsEnabled: user.telegram.notificationsEnabled
    });
  } catch (error) {
    console.error('Error checking Telegram connection status:', error);
    res.status(500).json({ message: 'Помилка сервера при перевірці статусу підключення', error: error.message });
  }
};

/**
 * Disconnect Telegram account
 * @route   POST /api/telegram/disconnect
 * @access  Private
 */
exports.disconnectTelegram = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    // Reset Telegram connection
    user.telegram.chatId = null;
    user.telegram.username = null;
    user.telegram.isConnected = false;
    user.telegram.connectionCode = null;
    user.telegram.codeExpires = null;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Telegram акаунт успішно відключено'
    });
  } catch (error) {
    console.error('Error disconnecting Telegram account:', error);
    res.status(500).json({ message: 'Помилка сервера при відключенні акаунта', error: error.message });
  }
};

/**
 * Toggle Telegram notifications
 * @route   POST /api/telegram/notifications
 * @access  Private
 */
exports.toggleNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    if (!user.telegram.isConnected) {
      return res.status(400).json({ message: 'Спочатку підключіть Telegram акаунт' });
    }
    
    // Toggle notifications
    user.telegram.notificationsEnabled = !user.telegram.notificationsEnabled;
    await user.save();
    
    const status = user.telegram.notificationsEnabled ? 'увімкнено' : 'вимкнено';
    
    res.json({
      success: true,
      notificationsEnabled: user.telegram.notificationsEnabled,
      message: `Сповіщення ${status}`
    });
  } catch (error) {
    console.error('Error toggling Telegram notifications:', error);
    res.status(500).json({ message: 'Помилка сервера при зміні налаштувань сповіщень', error: error.message });
  }
};

/**
 * Send a test notification to the user's Telegram
 * @route   POST /api/telegram/test-notification
 * @access  Private
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    
    if (!user.telegram.isConnected) {
      return res.status(400).json({ message: 'Спочатку підключіть Telegram акаунт' });
    }
    
    if (!user.telegram.notificationsEnabled) {
      return res.status(400).json({ message: 'Сповіщення вимкнено. Спочатку увімкніть їх.' });
    }
    
    // Send test notification
    const message = `*Тестове сповіщення*\n\nПривіт, ${user.name}! Це тестове сповіщення від PlanPilot. Якщо ви отримали це повідомлення, значить інтеграція з Telegram працює коректно.`;
    
    const sent = await telegramService.sendTaskNotification(user._id, message);
    
    if (!sent) {
      return res.status(500).json({ message: 'Не вдалося надіслати тестове сповіщення' });
    }
    
    res.json({
      success: true,
      message: 'Тестове сповіщення надіслано успішно'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Помилка сервера при надсиланні тестового сповіщення', error: error.message });
  }
};

/**
 * Handle Telegram webhook
 * @route   POST /api/telegram/webhook
 * @access  Public
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Log webhook data for debugging
    console.log('Telegram webhook received:', req.body);
    
    // Process webhook data in telegramService
    
    // Return 200 OK to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).json({ message: 'Помилка сервера при обробці вебхука', error: error.message });
  }
}; 