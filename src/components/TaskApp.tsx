import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import storageService, { Task } from '../services/storageService';

const TaskApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    category: 'personal'
  });
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load tasks and theme preference from localStorage on startup
  useEffect(() => {
    const savedTasks = storageService.getTasks();
    setTasks(savedTasks);
    
    const themePreference = storageService.getThemePreference();
    setDarkMode(themePreference === 'dark');
    if (themePreference === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    storageService.saveTasks(tasks);
  }, [tasks]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  // Add new task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task = storageService.createTask(newTask);
    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      category: 'personal'
    });
  };

  // Update task status
  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, status } : task
      )
    );
  };

  // Delete task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = (
      (filter.status === 'all' || task.status === filter.status) &&
      (filter.priority === 'all' || task.priority === filter.priority) &&
      (filter.category === 'all' || task.category === filter.category)
    );
    
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode');
    storageService.saveThemePreference(newDarkMode ? 'dark' : 'light');
  };

  // Calculate completion stats
  const completedCount = tasks.filter(task => task.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  // Task entry animation
  const taskVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <h1>PlanPilot</h1>
        <button className="theme-toggle" onClick={toggleDarkMode}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>
      
      <main>
        <motion.section 
          className="task-stats"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="stats-container">
            <div className="stat-item">
              <h4>Всього завдань</h4>
              <div className="stat-value">{totalCount}</div>
            </div>
            <div className="stat-item">
              <h4>Виконано</h4>
              <div className="stat-value">{completedCount}</div>
            </div>
            <div className="stat-item">
              <h4>Прогрес</h4>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="progress-text">{completionPercentage}%</span>
              </div>
            </div>
          </div>
        </motion.section>
        
        <motion.section 
          className="add-task"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2>Додати нове завдання</h2>
          <form onSubmit={addTask}>
            <div className="form-group">
              <label htmlFor="title">Назва</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Опис</label>
              <textarea
                id="description"
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Пріоритет</label>
                <select
                  id="priority"
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Низький</option>
                  <option value="medium">Середній</option>
                  <option value="high">Високий</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Категорія</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={newTask.category}
                  onChange={handleInputChange}
                  placeholder="напр., особисте, робота, спорт"
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary">Додати завдання</button>
          </form>
        </motion.section>
        
        <motion.section 
          className="task-filters"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2>Фільтри та пошук</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Пошук завдань..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters">
            <div className="filter-group">
              <label htmlFor="status-filter">Статус</label>
              <select
                id="status-filter"
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Всі</option>
                <option value="pending">Очікує</option>
                <option value="in-progress">В процесі</option>
                <option value="completed">Виконано</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="priority-filter">Пріоритет</label>
              <select
                id="priority-filter"
                value={filter.priority}
                onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="all">Всі</option>
                <option value="low">Низький</option>
                <option value="medium">Середній</option>
                <option value="high">Високий</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="category-filter">Категорія</label>
              <select
                id="category-filter"
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="all">Всі</option>
                {Array.from(new Set(tasks.map(t => t.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.section>
        
        <motion.section 
          className="task-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2>Ваші завдання ({filteredTasks.length})</h2>
          {filteredTasks.length === 0 ? (
            <p className="no-tasks">Завдань не знайдено. Спробуйте додати нові!</p>
          ) : (
            <div className="tasks">
              {filteredTasks.map((task, index) => (
                <motion.div 
                  key={task.id} 
                  className={`task-card priority-${task.priority}`}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={taskVariants}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                  }}
                >
                  <div className="task-header">
                    <h3>{task.title}</h3>
                    <span className={`status status-${task.status}`}>
                      {task.status === 'pending' ? 'Очікує' : 
                       task.status === 'in-progress' ? 'В процесі' : 'Виконано'}
                    </span>
                  </div>
                  
                  <p className="task-description">{task.description || "Опис відсутній."}</p>
                  
                  <div className="task-meta">
                    <span className="task-category">{task.category}</span>
                    <span className="task-date">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                    >
                      <option value="pending">Очікує</option>
                      <option value="in-progress">В процесі</option>
                      <option value="completed">Виконано</option>
                    </select>
                    
                    <button 
                      className="btn btn-danger"
                      onClick={() => deleteTask(task.id)}
                    >
                      Видалити
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
      
      <footer>
        <p>PlanPilot © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default TaskApp; 