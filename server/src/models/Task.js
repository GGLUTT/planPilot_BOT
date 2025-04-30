const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Будь ласка, додайте назву завдання'],
    trim: true,
    maxlength: [100, 'Назва не може бути довшою за 100 символів']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Опис не може бути довшим за 1000 символів']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    required: [true, 'Будь ласка, вкажіть категорію'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  reminderSet: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: Date,
    default: null
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
});

// Create index for faster queries
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, category: 1 });
TaskSchema.index({ user: 1, priority: 1 });

// Add method to mark task as complete
TaskSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Add middleware to check for due tasks needing reminders
TaskSchema.statics.findDueTasksForReminders = function() {
  const now = new Date();
  
  return this.find({
    reminderSet: true,
    reminderSent: false,
    reminderTime: { $lte: now }
  }).populate('user', 'name email telegram.chatId telegram.notificationsEnabled');
};

module.exports = mongoose.model('Task', TaskSchema); 