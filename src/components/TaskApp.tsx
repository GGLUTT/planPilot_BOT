import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import storageService, { Task } from '../services/storageService';
import Confetti from './Confetti';
import MotivationalQuote from './MotivationalQuote';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [newTag, setNewTag] = useState('');

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
    setShowAddForm(false); // Hide form after adding
  };

  // Update task status
  const updateTaskStatus = (id: string, status: Task['status']) => {
    let updatedTasks;
    if (status === 'completed') {
      updatedTasks = storageService.completeTask(tasks, id);
      // Show confetti when task is completed
      setShowConfetti(true);
      // Show motivational quote with 20% chance
      if (Math.random() < 0.2) {
        setTimeout(() => {
          setShowQuote(true);
        }, 2000);
      }
    } else {
      updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, status } : task
      );
    }
    setTasks(updatedTasks);
  };

  // Delete task
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };
  
  // Add tag to task
  const addTagToTask = (id: string, tag: string) => {
    if (!tag.trim()) return;
    const updatedTasks = storageService.addTagToTask(tasks, id, tag);
    setTasks(updatedTasks);
    setNewTag('');
  };
  
  // Remove tag from task
  const removeTagFromTask = (id: string, tag: string) => {
    const updatedTasks = storageService.removeTagFromTask(tasks, id, tag);
    setTasks(updatedTasks);
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
      task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
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

  // Get unique categories for filter dropdown
  const categories = ['all', ...tasks.map(task => task.category).filter((value, index, self) => self.indexOf(value) === index)];

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
    }),
    exit: { opacity: 0, x: -100, transition: { duration: 0.2 } }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Confetti component for task completion */}
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Motivational Quote Component */}
      {showQuote && <MotivationalQuote onClose={() => setShowQuote(false)} />}
      
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
          className="task-filters"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="filters-header">
            <h2>Фільтри та пошук</h2>
            <motion.button 
              className="add-task-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Скасувати' : 'Нове завдання'}
            </motion.button>
          </div>

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
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category === 'all' ? 'Всі' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.section>
        
        <AnimatePresence>
          {showAddForm && (
            <motion.section 
              className="add-task"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
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
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Додати завдання</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Скасувати</button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>
        
        <motion.section 
          className="task-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2>Мої завдання</h2>
          
          {filteredTasks.length > 0 ? (
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div 
                  key={task.id}
                  custom={index}
                  variants={taskVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`task-card priority-${task.priority}`}
                  style={{ borderTopColor: task.priority === 'high' ? 'var(--danger-color)' : task.priority === 'medium' ? 'var(--warning-color)' : 'var(--success-color)' }}
                >
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p className="task-description">{task.description}</p>}
                    <div className="task-meta">
                      <span className="task-category">{task.category}</span>
                      <span className="task-date">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                      className={`status-select status-${task.status}`}
                    >
                      <option value="pending">Очікує</option>
                      <option value="in-progress">В процесі</option>
                      <option value="completed">Виконано</option>
                    </select>
                    
                    <button 
                      className="delete-task"
                      onClick={() => deleteTask(task.id)}
                      aria-label="Видалити завдання"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="no-tasks">
              <p>Немає завдань, що відповідають вашим фільтрам.</p>
              {filter.status !== 'all' || filter.priority !== 'all' || filter.category !== 'all' || searchTerm ? (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setFilter({ status: 'all', priority: 'all', category: 'all' });
                    setSearchTerm('');
                  }}
                >
                  Скинути фільтри
                </button>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddForm(true)}
                >
                  Додати перше завдання
                </button>
              )}
            </div>
          )}
        </motion.section>
      </main>
      
      <footer>
        <p>PlanPilot © {new Date().getFullYear()}</p>
      </footer>

      <motion.button 
        className="floating-action-btn"
        onClick={() => setShowAddForm(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </motion.button>
    </div>
  );
};

export default TaskApp; 