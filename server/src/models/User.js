const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/jsonDbService');

// User model replacement for JSON DB
class User {
  // Static functions (mongoose-like interface)
  static async findOne(query) {
    const users = await db.getUsers();
    if (query.email) {
      return users.find(user => user.email === query.email);
    }
    return null;
  }

  static async findById(id) {
    return await db.getUserById(id);
  }

  static async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user object with default values
    const user = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      avatar: userData.avatar || '/avatars/avatar1.png',
      theme: userData.theme || 'light',
      createdAt: userData.createdAt || new Date(),
      // Telegram integration
      telegram: {
        chatId: null,
        username: null,
        isConnected: false,
        connectionCode: null,
        codeExpires: null,
        notificationsEnabled: true
      },
      // Subscription
      subscription: {
        plan: 'free',
        startDate: null,
        endDate: null,
        active: false,
        autoRenew: false,
        paymentMethod: null
      }
    };

    // Save to JSON DB
    const savedUser = await db.createUser(user);
    
    // Add helper methods
    return this.addUserMethods(savedUser);
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const user = await db.updateUser(id, updateData);
    return this.addUserMethods(user);
  }

  // Add methods to user objects
  static addUserMethods(user) {
    if (!user) return null;

    // Sign JWT and return
    user.getSignedJwtToken = function() {
      return jwt.sign(
        { id: this.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
      );
    };

    // Match user entered password to hashed password in database
    user.matchPassword = async function(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    };

    // Generate and hash Telegram connection code
    user.generateTelegramCode = async function() {
      // Generate random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set code expiration (10 minutes)
      const codeExpires = new Date();
      codeExpires.setMinutes(codeExpires.getMinutes() + 10);
      
      // Update user with code
      this.telegram.connectionCode = code;
      this.telegram.codeExpires = codeExpires;
      
      // Save changes
      await db.updateUser(this.id, { 
        telegram: this.telegram 
      });
      
      return code;
    };

    // Save method
    user.save = async function() {
      return await db.updateUser(this.id, this);
    };

    return user;
  }
}

module.exports = User; 