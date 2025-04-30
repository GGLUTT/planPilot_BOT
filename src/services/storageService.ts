// Type definitions for our data
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  completedAt?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  theme: 'light' | 'dark';
  createdAt: string;
}

export interface Analytics {
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  weeklyCompletion: Record<string, number>;
}

// Storage keys
const TASKS_STORAGE_KEY = 'planpilot_tasks';
const THEME_STORAGE_KEY = 'planpilot_theme';
const USER_PROFILE_KEY = 'planpilot_user_profile';

// Task storage functions
export const getTasks = (): Task[] => {
  try {
    const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return [];
  }
};

export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

// Theme storage functions
export const getThemePreference = (): 'light' | 'dark' => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // If no theme is saved, use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (error) {
    console.error('Error reading theme preference from localStorage:', error);
    return 'light';
  }
};

export const saveThemePreference = (theme: 'light' | 'dark'): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Error saving theme preference to localStorage:', error);
  }
};

// Helper functions for tasks
export const createTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
  return {
    ...taskData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
};

// User profile functions
export const getUserProfile = (): UserProfile => {
  try {
    const profileJson = localStorage.getItem(USER_PROFILE_KEY);
    if (profileJson) {
      return JSON.parse(profileJson);
    }
    // Default profile
    return {
      name: 'Користувач',
      avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      email: '',
      theme: getThemePreference(),
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error reading user profile from localStorage:', error);
    return {
      name: 'Користувач',
      avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      email: '',
      theme: 'light',
      createdAt: new Date().toISOString()
    };
  }
};

export const saveUserProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile to localStorage:', error);
  }
};

// Analytics functions
export const getAnalytics = (): Analytics => {
  const tasks = getTasks();
  
  // Basic counts
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  
  // By category
  const byCategory: Record<string, number> = {};
  tasks.forEach(task => {
    byCategory[task.category] = (byCategory[task.category] || 0) + 1;
  });
  
  // By priority
  const byPriority: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0
  };
  tasks.forEach(task => {
    byPriority[task.priority] += 1;
  });
  
  // Weekly completion
  const weeklyCompletion: Record<string, number> = {};
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(oneWeekAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split('T')[0];
    weeklyCompletion[dateString] = 0;
  }
  
  tasks
    .filter(task => task.status === 'completed' && task.completedAt)
    .forEach(task => {
      if (task.completedAt) {
        const completedDate = task.completedAt.split('T')[0];
        if (weeklyCompletion[completedDate] !== undefined) {
          weeklyCompletion[completedDate] += 1;
        }
      }
    });
  
  return {
    completedTasks,
    pendingTasks,
    inProgressTasks,
    byCategory,
    byPriority,
    weeklyCompletion
  };
};

// Complete a task (with completion timestamp)
export const completeTask = (tasks: Task[], taskId: string): Task[] => {
  return tasks.map(task => 
    task.id === taskId 
      ? { ...task, status: 'completed', completedAt: new Date().toISOString() } 
      : task
  );
};

// Export default object with all functions
export default {
  getTasks,
  saveTasks,
  getThemePreference,
  saveThemePreference,
  createTask,
  getUserProfile,
  saveUserProfile,
  getAnalytics,
  completeTask
}; 