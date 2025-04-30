const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const Task = require('../models/Task');

let bot;

/**
 * Initialize the Telegram bot
 */
const initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is required to initialize the bot');
    return null;
  }
  
  // Create bot instance
  bot = new TelegramBot(token, { polling: true });
  
  // Set commands menu
  bot.setMyCommands([
    { command: '/start', description: 'Почати роботу з ботом' },
    { command: '/tasks', description: 'Переглянути ваші завдання' },
    { command: '/today', description: 'Завдання на сьогодні' },
    { command: '/connect', description: 'Підключити акаунт PlanPilot' },
    { command: '/disconnect', description: 'Відключити акаунт' },
    { command: '/notifications', description: 'Налаштування сповіщень' },
    { command: '/help', description: 'Отримати допомогу' }
  ]);
  
  // Register message handlers
  registerBotHandlers(bot);
  
  return bot;
};

/**
 * Register all message handlers for the bot
 */
const registerBotHandlers = (bot) => {
  // Start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    
    // Check if user already connected
    const user = await User.findOne({ 'telegram.chatId': chatId });
    
    if (user) {
      bot.sendMessage(chatId, `Вітаю, ${user.name}! Ваш акаунт вже підключено до PlanPilot. Використовуйте команди для керування завданнями.`);
    } else {
      bot.sendMessage(chatId, 
        `Вітаю! Я бот PlanPilot для керування завданнями. ` +
        `Щоб підключити ваш акаунт, введіть команду /connect та код, який ви отримаєте в додатку PlanPilot.`
      );
    }
  });
  
  // Help command
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 
      `*Команди PlanPilot бота:*\n\n` +
      `/start - Почати роботу з ботом\n` +
      `/tasks - Переглянути ваші завдання\n` +
      `/today - Завдання на сьогодні\n` +
      `/connect - Підключити акаунт PlanPilot\n` +
      `/disconnect - Відключити акаунт\n` +
      `/notifications - Налаштування сповіщень\n` +
      `/help - Отримати допомогу`,
      { parse_mode: 'Markdown' }
    );
  });
  
  // Connect command with code
  bot.onText(/\/connect(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || '';
    const code = match[1];
    
    // Check if user already connected
    const existingUser = await User.findOne({ 'telegram.chatId': chatId });
    
    if (existingUser) {
      return bot.sendMessage(chatId, `Ви вже підключені до акаунту ${existingUser.name}. Якщо хочете підключити інший акаунт, спочатку відключіть поточний командою /disconnect.`);
    }
    
    if (!code) {
      return bot.sendMessage(chatId, 'Будь ласка, введіть код підключення у форматі: /connect КОД\nКод можна отримати в додатку PlanPilot у розділі профілю.');
    }
    
    try {
      // Find user by connection code
      const user = await User.findOne({ 
        'telegram.connectionCode': code,
        'telegram.codeExpires': { $gt: new Date() }
      });
      
      if (!user) {
        return bot.sendMessage(chatId, 'Невірний або застарілий код підключення. Будь ласка, згенеруйте новий код у додатку PlanPilot.');
      }
      
      // Connect user
      user.telegram.chatId = chatId.toString();
      user.telegram.username = username;
      user.telegram.isConnected = true;
      user.telegram.connectionCode = null;
      user.telegram.codeExpires = null;
      await user.save();
      
      bot.sendMessage(chatId, `Акаунт успішно підключено! Вітаємо, ${user.name}.\nТепер ви можете керувати вашими завданнями через Telegram.`);
    } catch (error) {
      console.error('Error connecting Telegram account:', error);
      bot.sendMessage(chatId, 'Сталася помилка при підключенні акаунту. Спробуйте пізніше.');
    }
  });
  
  // Disconnect command
  bot.onText(/\/disconnect/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Find user by chatId
      const user = await User.findOne({ 'telegram.chatId': chatId });
      
      if (!user) {
        return bot.sendMessage(chatId, 'Ви не підключені до жодного акаунту PlanPilot.');
      }
      
      // Disconnect user
      user.telegram.chatId = null;
      user.telegram.username = null;
      user.telegram.isConnected = false;
      await user.save();
      
      bot.sendMessage(chatId, 'Акаунт успішно відключено. Ви більше не будете отримувати сповіщення.');
    } catch (error) {
      console.error('Error disconnecting Telegram account:', error);
      bot.sendMessage(chatId, 'Сталася помилка при відключенні акаунту. Спробуйте пізніше.');
    }
  });
  
  // Tasks command
  bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Find user by chatId
      const user = await User.findOne({ 'telegram.chatId': chatId });
      
      if (!user) {
        return bot.sendMessage(chatId, 'Спочатку підключіть ваш акаунт PlanPilot командою /connect.');
      }
      
      // Get user's tasks
      const tasks = await Task.find({ user: user._id }).sort({ priority: -1 });
      
      if (tasks.length === 0) {
        return bot.sendMessage(chatId, 'У вас немає активних завдань.');
      }
      
      // Format tasks message
      let tasksMsg = '*Ваші завдання:*\n\n';
      
      tasks.forEach((task, index) => {
        const prioritySymbol = task.priority === 'high' ? '🔴' : (task.priority === 'medium' ? '🟠' : '🟢');
        const statusSymbol = task.status === 'completed' ? '✅' : (task.status === 'in-progress' ? '⏳' : '⏰');
        
        tasksMsg += `${index + 1}. ${statusSymbol} ${prioritySymbol} *${task.title}*\n`;
        if (task.description) {
          tasksMsg += `   ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}\n`;
        }
        tasksMsg += `   Категорія: ${task.category}\n\n`;
      });
      
      bot.sendMessage(chatId, tasksMsg, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error getting tasks:', error);
      bot.sendMessage(chatId, 'Сталася помилка при отриманні завдань. Спробуйте пізніше.');
    }
  });
  
  // Today's tasks
  bot.onText(/\/today/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Find user by chatId
      const user = await User.findOne({ 'telegram.chatId': chatId });
      
      if (!user) {
        return bot.sendMessage(chatId, 'Спочатку підключіть ваш акаунт PlanPilot командою /connect.');
      }
      
      // Get today's start and end
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get user's tasks for today
      const tasks = await Task.find({
        user: user._id,
        $or: [
          { dueDate: { $gte: today, $lt: tomorrow } },
          { status: 'in-progress' }
        ]
      }).sort({ priority: -1 });
      
      if (tasks.length === 0) {
        return bot.sendMessage(chatId, 'У вас немає завдань на сьогодні.');
      }
      
      // Format tasks message
      let tasksMsg = '*Завдання на сьогодні:*\n\n';
      
      tasks.forEach((task, index) => {
        const prioritySymbol = task.priority === 'high' ? '🔴' : (task.priority === 'medium' ? '🟠' : '🟢');
        const statusSymbol = task.status === 'completed' ? '✅' : (task.status === 'in-progress' ? '⏳' : '⏰');
        
        tasksMsg += `${index + 1}. ${statusSymbol} ${prioritySymbol} *${task.title}*\n`;
        tasksMsg += `   Категорія: ${task.category}\n\n`;
      });
      
      bot.sendMessage(chatId, tasksMsg, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error getting today tasks:', error);
      bot.sendMessage(chatId, 'Сталася помилка при отриманні завдань. Спробуйте пізніше.');
    }
  });
  
  // Toggle notifications
  bot.onText(/\/notifications/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Find user by chatId
      const user = await User.findOne({ 'telegram.chatId': chatId });
      
      if (!user) {
        return bot.sendMessage(chatId, 'Спочатку підключіть ваш акаунт PlanPilot командою /connect.');
      }
      
      // Toggle notifications
      user.telegram.notificationsEnabled = !user.telegram.notificationsEnabled;
      await user.save();
      
      const status = user.telegram.notificationsEnabled ? 'увімкнено' : 'вимкнено';
      bot.sendMessage(chatId, `Сповіщення ${status}. ${user.telegram.notificationsEnabled ? 'Ви будете отримувати сповіщення про завдання.' : 'Ви не будете отримувати сповіщення.'}`);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      bot.sendMessage(chatId, 'Сталася помилка при зміні налаштувань сповіщень. Спробуйте пізніше.');
    }
  });
  
  // Handle unknown commands
  bot.on('message', (msg) => {
    // Skip messages that were handled by other handlers
    if (msg.text && msg.text.startsWith('/')) {
      const command = msg.text.split(' ')[0];
      const knownCommands = ['/start', '/help', '/connect', '/disconnect', '/tasks', '/today', '/notifications'];
      
      if (!knownCommands.includes(command)) {
        bot.sendMessage(msg.chat.id, `Невідома команда: ${command}. Використовуйте /help для перегляду доступних команд.`);
      }
    }
  });
};

/**
 * Send a task notification to a user
 */
const sendTaskNotification = async (userId, message) => {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return false;
  }
  
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user || !user.telegram.isConnected || !user.telegram.notificationsEnabled) {
      return false;
    }
    
    // Send notification
    await bot.sendMessage(user.telegram.chatId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
};

/**
 * Send a reminder for a task
 */
const sendTaskReminder = async (task) => {
  if (!task.user || !task.user.telegram || !task.user.telegram.chatId) {
    return false;
  }
  
  try {
    const prioritySymbol = task.priority === 'high' ? '🔴' : (task.priority === 'medium' ? '🟠' : '🟢');
    
    const message = `*Нагадування про завдання*\n\n` +
      `${prioritySymbol} *${task.title}*\n` +
      `Категорія: ${task.category}\n` +
      `${task.description ? `Опис: ${task.description}\n` : ''}`;
    
    await bot.sendMessage(task.user.telegram.chatId, message, { parse_mode: 'Markdown' });
    
    // Mark reminder as sent
    task.reminderSent = true;
    await task.save();
    
    return true;
  } catch (error) {
    console.error('Error sending task reminder:', error);
    return false;
  }
};

/**
 * Process due task reminders
 */
const processDueTaskReminders = async () => {
  try {
    const dueTasks = await Task.findDueTasksForReminders();
    
    for (const task of dueTasks) {
      await sendTaskReminder(task);
    }
    
    return dueTasks.length;
  } catch (error) {
    console.error('Error processing due tasks:', error);
    return 0;
  }
};

module.exports = {
  initBot,
  sendTaskNotification,
  sendTaskReminder,
  processDueTaskReminders,
  getBot: () => bot
}; 