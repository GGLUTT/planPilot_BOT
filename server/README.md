# PlanPilot Server API

Бекенд для додатку PlanPilot з інтеграцією Telegram

## Встановлення

```bash
# Встановлення залежностей
npm install

# Копіювання та налаштування змінних середовища
cp .env.example .env

# Запуск в режимі розробки
npm run dev

# Запуск в продакшн режимі
npm start
```

## Змінні середовища

Створіть файл `.env` в корені серверної частини та налаштуйте наступні змінні:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/planpilot

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
WEBHOOK_URL=https://your-app-url.com/api/telegram/webhook

# Uploads Folder
UPLOAD_PATH=uploads
```

## Telegram бот

1. Створіть нового бота через [@BotFather](https://t.me/BotFather) в Telegram
2. Отримайте та збережіть токен бота у `.env` файлі
3. Запустіть сервер, який автоматично налаштує бота

## API Endpoints

### Аутентифікація

- `POST /api/auth/register` - Реєстрація нового користувача
- `POST /api/auth/login` - Вхід користувача
- `GET /api/auth/me` - Отримання поточного користувача
- `PUT /api/auth/updatedetails` - Оновлення даних користувача
- `PUT /api/auth/updatepassword` - Зміна пароля

### Завдання

- `GET /api/tasks` - Отримання списку завдань
- `POST /api/tasks` - Створення нового завдання
- `GET /api/tasks/:id` - Отримання конкретного завдання
- `PUT /api/tasks/:id` - Оновлення завдання
- `DELETE /api/tasks/:id` - Видалення завдання
- `PUT /api/tasks/:id/complete` - Позначення завдання як виконаного

### Профіль

- `GET /api/profile` - Отримання профілю
- `PUT /api/profile` - Оновлення профілю
- `PUT /api/profile/avatar` - Оновлення аватара

### Підписка

- `GET /api/subscription` - Отримання інформації про підписку
- `POST /api/subscription/activate` - Активація підписки
- `POST /api/subscription/cancel` - Скасування автопродовження

### Telegram інтеграція

- `POST /api/telegram/generate-code` - Генерація коду для підключення Telegram
- `GET /api/telegram/status` - Перевірка статусу підключення
- `POST /api/telegram/disconnect` - Відключення Telegram
- `POST /api/telegram/notifications` - Увімкнення/вимкнення сповіщень
- `POST /api/telegram/test-notification` - Надсилання тестового сповіщення
- `POST /api/telegram/webhook` - Webhook для Telegram (публічний)

## Розгортання

Рекомендовані платформи для розгортання:

- [Render](https://render.com/) - Безкоштовний хостинг для бекенду з постійним URL
- [Cyclic](https://www.cyclic.sh/) - Безплатне розгортання Node.js додатків
- [Railway](https://railway.app/) - Простий деплой з Git репозиторія

## Використання з Telegram

1. Користувач реєструється в додатку
2. В профілі користувач натискає "Підключити Telegram"
3. Система генерує 6-значний код підключення
4. Користувач знаходить бота в Telegram і надсилає код
5. Після підключення користувач може використовувати всі функції через Telegram:
   - Переглядати завдання
   - Отримувати сповіщення
   - Відмічати виконані завдання 