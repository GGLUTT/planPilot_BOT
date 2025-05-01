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
  
  // Якщо бот вже ініціалізований, повертаємо існуючий екземпляр
  if (bot) {
    console.log('Bot already initialized, returning existing instance');
    return bot;
  }
  
  try {
    // Create bot instance with additional options to prevent conflicts
    bot = new TelegramBot(token, { 
      polling: {
        restart: true,
        params: {
          timeout: 30,
          limit: 100
        }
      } 
    });
    
    // Обробка помилок поллінгу
    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error.message);
      
      // Якщо помилка конфлікту (409), зупиняємо поточний поллінг і перезапускаємо через певний час
      if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('Conflict detected, stopping polling');
        
        bot.stopPolling()
          .then(() => {
            console.log('Polling stopped due to conflict');
            // Почекаємо трохи перед перезапуском
            setTimeout(() => {
              console.log('Restarting polling after conflict');
              bot.startPolling();
            }, 5000); // 5 секунд пауза
          })
          .catch(err => console.error('Error stopping polling:', err));
      }
    });
    
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
    
    console.log('Telegram bot successfully initialized');
    return bot;
  } catch (error) {
    console.error('Error initializing Telegram bot:', error);
    return null;
  }
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
    
    // Create inline keyboard with WebApp button
    const webAppUrl = process.env.CLIENT_URL || 'https://gglutt.github.io/planPilot_BOT';
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "Відкрити PlanPilot",
            web_app: { url: webAppUrl }
          }
        ]
      ]
    };
    
    if (user) {
      bot.sendMessage(
        chatId, 
        `Вітаю, ${user.name}! Ваш акаунт вже підключено до PlanPilot. Використовуйте команди для керування завданнями або відкрийте веб-додаток:`,
        { reply_markup: inlineKeyboard }
      );
    } else {
      bot.sendMessage(
        chatId, 
        `Вітаю! Я бот PlanPilot для керування завданнями. ` +
        `Щоб підключити ваш акаунт, введіть команду /connect та код, який ви отримаєте в додатку PlanPilot.\n\n` +
        `Ви також можете відкрити веб-додаток, натиснувши кнопку нижче:`,
        { reply_markup: inlineKeyboard }
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
  
  // Notifications command
  bot.onText(/\/notifications/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Find user by chatId
      const user = await User.findOne({ 'telegram.chatId': chatId });
      
      if (!user) {
        return bot.sendMessage(chatId, 'Ви не підключені до жодного акаунту PlanPilot. Використайте /connect для підключення.');
      }
      
      // Створюємо клавіатуру для включення/відключення сповіщень
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: user.telegram.notificationsEnabled ? '🔕 Вимкнути сповіщення' : '🔔 Увімкнути сповіщення',
              callback_data: `toggle_notifications:${!user.telegram.notificationsEnabled}`
            }
          ],
          [
            {
              text: '📝 Керувати завданнями',
              web_app: { url: process.env.CLIENT_URL || 'https://gglutt.github.io/planPilot_BOT' }
            }
          ]
        ]
      };
      
      bot.sendMessage(
        chatId, 
        `*Налаштування сповіщень*\n\nПоточний статус: ${user.telegram.notificationsEnabled ? '🔔 Увімкнено' : '🔕 Вимкнено'}\n\n` +
        `Ви ${user.telegram.notificationsEnabled ? 'отримуєте' : 'не отримуєте'} сповіщення про завдання.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Error handling notifications command:', error);
      bot.sendMessage(chatId, 'Помилка при отриманні налаштувань сповіщень. Спробуйте пізніше.');
    }
  });
  
  // Handle callback queries for buttons
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    
    // Handle different callback types
    if (data.startsWith('toggle_notifications:')) {
      const enabled = data.split(':')[1] === 'true';
      
      try {
        // Find user by chatId
        const user = await User.findOne({ 'telegram.chatId': chatId });
        
        if (!user) {
          return bot.answerCallbackQuery(query.id, { text: 'Помилка: акаунт не знайдено' });
        }
        
        // Update notification settings
        user.telegram.notificationsEnabled = enabled;
        await user.save();
        
        // Update message with new status
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: enabled ? '🔕 Вимкнути сповіщення' : '🔔 Увімкнути сповіщення',
                callback_data: `toggle_notifications:${!enabled}`
              }
            ],
            [
              {
                text: '📝 Керувати завданнями',
                web_app: { url: process.env.CLIENT_URL || 'https://gglutt.github.io/planPilot_BOT' }
              }
            ]
          ]
        };
        
        await bot.editMessageText(
          `*Налаштування сповіщень*\n\nПоточний статус: ${enabled ? '🔔 Увімкнено' : '🔕 Вимкнено'}\n\n` +
          `Ви ${enabled ? 'отримуєте' : 'не отримуєте'} сповіщення про завдання.`,
          { 
            chat_id: chatId, 
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
        
        // Answer callback query
        bot.answerCallbackQuery(query.id, { 
          text: enabled ? 'Сповіщення увімкнено' : 'Сповіщення вимкнено'
        });
      } catch (error) {
        console.error('Error handling toggle notifications:', error);
        bot.answerCallbackQuery(query.id, { text: 'Помилка при зміні налаштувань' });
      }
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
 * Send a notification about a task to the user via Telegram
 * @param {Object} user User object
 * @param {Object} task Task object
 */
const sendTaskNotification = async (userId, message) => {
  try {
    // Ensure bot is initialized
    if (!bot) {
      console.error('Telegram bot not initialized');
      return false;
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user || !user.telegram || !user.telegram.chatId || !user.telegram.isConnected) {
      console.log('User not connected to Telegram or chatId missing', userId);
      return false;
    }
    
    // Check if notifications are enabled
    if (!user.telegram.notificationsEnabled) {
      console.log('Notifications disabled for user', userId);
      return false;
    }
    
    // Send message
    await bot.sendMessage(user.telegram.chatId, message, { parse_mode: 'Markdown' });
    
    return true;
  } catch (error) {
    console.error('Error sending task notification:', error);
    return false;
  }
};

/**
 * Send reminder about a due task to the user
 * @param {Object} task Task object with user reference
 */
const sendTaskReminder = async (task) => {
  try {
    const user = await User.findById(task.userId);
    
    if (!user) {
      console.log('User not found for task reminder', task.id);
      return false;
    }
    
    const message = `🔔 *Нагадування про завдання*\n\n` +
      `Завдання: *${task.title}*\n` +
      `Пріоритет: ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟠' : '🟢'} ${task.priority}\n` +
      `Категорія: ${task.category}\n\n` +
      `${task.description ? `Опис: ${task.description}\n\n` : ''}` +
      `Щоб відкрити завдання, перейдіть до додатку PlanPilot.`;
    
    return await sendTaskNotification(task.userId, message);
  } catch (error) {
    console.error('Error sending task reminder:', error);
    return false;
  }
};

/**
 * Process all due task reminders
 * Finds tasks with reminders that should be sent and sends them via Telegram
 */
const processDueTaskReminders = async () => {
  try {
    // Find all tasks that need reminders
    const dueTasks = await Task.findDueTasksForReminders();
    
    if (dueTasks.length === 0) {
      return;
    }
    
    console.log(`Processing ${dueTasks.length} due task reminders`);
    
    for (const task of dueTasks) {
      // Skip if Telegram reminders not enabled
      if (!task.telegramReminderEnabled) {
        console.log(`Telegram reminder not enabled for task ${task.id}`);
        continue;
      }
      
      // Send reminder
      const sent = await sendTaskReminder(task);
      
      if (sent) {
        console.log(`Sent reminder for task ${task.id}`);
        
        // Mark reminder as sent
        task.reminderSent = true;
        await task.save();
      } else {
        console.log(`Failed to send reminder for task ${task.id}`);
      }
    }
  } catch (error) {
    console.error('Error processing due task reminders:', error);
  }
};

// Set up a periodic check for task reminders
const startReminderChecker = () => {
  // Check for reminders every minute
  const checkInterval = 60 * 1000; // 1 minute
  
  console.log('Starting reminder checker with interval', checkInterval, 'ms');
  
  // Initial check after startup
  setTimeout(processDueTaskReminders, 10000);
  
  // Set up interval for regular checks
  return setInterval(processDueTaskReminders, checkInterval);
};

module.exports = {
  initBot,
  getBot: () => bot,
  sendTaskNotification,
  sendTaskReminder,
  processDueTaskReminders,
  startReminderChecker
}; 