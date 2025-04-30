const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Будь ласка, додайте ім\'я'],
    trim: true,
    maxlength: [50, 'Ім\'я не може бути довшим за 50 символів']
  },
  email: {
    type: String,
    required: [true, 'Будь ласка, додайте email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Будь ласка, додайте коректний email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Будь ласка, додайте пароль'],
    minlength: [6, 'Пароль має містити не менше 6 символів'],
    select: false
  },
  avatar: {
    type: String,
    default: '/avatars/avatar1.png'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Telegram integration
  telegram: {
    chatId: {
      type: String,
      default: null
    },
    username: {
      type: String,
      default: null
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    connectionCode: {
      type: String,
      default: null
    },
    codeExpires: {
      type: Date,
      default: null
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
  },
  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    active: {
      type: Boolean,
      default: false
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      default: null
    }
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash Telegram connection code
UserSchema.methods.generateTelegramCode = async function() {
  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set code expiration (10 minutes)
  const codeExpires = new Date();
  codeExpires.setMinutes(codeExpires.getMinutes() + 10);
  
  // Save to user
  this.telegram.connectionCode = code;
  this.telegram.codeExpires = codeExpires;
  await this.save();
  
  return code;
};

module.exports = mongoose.model('User', UserSchema); 