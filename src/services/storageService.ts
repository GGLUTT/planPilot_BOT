// Type definitions for our data
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
}

// Storage keys
const TASKS_STORAGE_KEY = 'planpilot_tasks';
const THEME_STORAGE_KEY = 'planpilot_theme';

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

// Export default object with all functions
export default {
  getTasks,
  saveTasks,
  getThemePreference,
  saveThemePreference,
  createTask
}; 