const { v4: uuidv4 } = require('uuid');
const db = require('../services/jsonDbService');

// Task model replacement for JSON DB
class Task {
  // Static functions (mongoose-like interface)
  static async find(query = {}) {
    const tasks = await db.getTasks();
    
    // Filter tasks based on query
    return tasks.filter(task => {
      // Filter by user
      if (query.user && task.userId !== query.user) {
        return false;
      }
      
      // Filter by status
      if (query.status && task.status !== query.status) {
        return false;
      }

      // Filter by category
      if (query.category && task.category !== query.category) {
        return false;
      }
      
      // Filter by reminders
      if (query.reminderSet !== undefined && task.reminderSet !== query.reminderSet) {
        return false;
      }
      
      if (query.reminderSent !== undefined && task.reminderSent !== query.reminderSent) {
        return false;
      }
      
      // Filter by reminder time (for notifications)
      if (query.reminderTime && query.reminderTime.$lte) {
        const limitTime = new Date(query.reminderTime.$lte);
        const taskTime = new Date(task.reminderTime);
        if (taskTime > limitTime) {
          return false;
        }
      }
      
      return true;
    });
  }

  static async findById(id) {
    return await db.getTaskById(id);
  }

  static async create(taskData) {
    // Create task object with default values
    const task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      category: taskData.category,
      userId: taskData.user, // Changed from user to userId
      createdAt: taskData.createdAt || new Date(),
      completedAt: taskData.completedAt || null,
      dueDate: taskData.dueDate || null,
      reminderSet: taskData.reminderSet || false,
      reminderTime: taskData.reminderTime || null,
      reminderSent: taskData.reminderSent || false
    };

    // Save to JSON DB
    const savedTask = await db.createTask(task);
    
    // Add helper methods
    return this.addTaskMethods(savedTask);
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const task = await db.updateTask(id, updateData);
    return this.addTaskMethods(task);
  }

  static async findByIdAndDelete(id) {
    await db.deleteTask(id);
    return null;
  }

  // Find tasks for reminders
  static async findDueTasksForReminders() {
    const now = new Date();
    const tasks = await this.find({
      reminderSet: true,
      reminderSent: false,
      reminderTime: { $lte: now }
    });
    
    // Add methods to all tasks
    return tasks.map(task => this.addTaskMethods(task));
  }

  // Add methods to task objects
  static addTaskMethods(task) {
    if (!task) return null;

    // Add method to mark task as complete
    task.complete = async function() {
      this.status = 'completed';
      this.completedAt = new Date();
      return await db.updateTask(this.id, this);
    };

    // Save method
    task.save = async function() {
      return await db.updateTask(this.id, this);
    };

    return task;
  }
}

module.exports = Task; 