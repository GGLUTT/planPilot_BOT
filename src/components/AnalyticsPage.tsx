import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import storageService, { Analytics, Task } from '../services/storageService';
import '../styles/AnalyticsPage.css';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics>(storageService.getAnalytics());
  const [tasks, setTasks] = useState<Task[]>(storageService.getTasks());
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Refresh analytics when tasks change
    const updateAnalytics = () => {
      setAnalytics(storageService.getAnalytics());
    };
    
    updateAnalytics();
  }, [tasks]);

  // Get unique categories
  const categories = ['all', ...Object.keys(analytics.byCategory)].filter((value, index, self) => self.indexOf(value) === index);

  // Calculate completion rate
  const completionRate = tasks.length > 0 
    ? Math.round((analytics.completedTasks / tasks.length) * 100) 
    : 0;

  // Filter tasks by date and category for the report
  const getFilteredTasks = () => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch(dateRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const matchesDate = taskDate >= cutoffDate;
      const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
      
      return matchesDate && matchesCategory;
    });
  };

  const filteredTasks = getFilteredTasks();
  const completedFilteredTasks = filteredTasks.filter(task => task.status === 'completed');
  const filteredCompletionRate = filteredTasks.length > 0 
    ? Math.round((completedFilteredTasks.length / filteredTasks.length) * 100) 
    : 0;

  // Chart data for weekly completion
  const weeklyData = Object.entries(analytics.weeklyCompletion).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMM', { locale: uk });
    } catch (e) {
      return dateString;
    }
  };

  // Chart data for category distribution
  const categoryChartData = {
    labels: Object.keys(analytics.byCategory),
    datasets: [
      {
        data: Object.values(analytics.byCategory),
        backgroundColor: [
          '#7986CB',
          '#4DB6AC',
          '#FFB74D',
          '#F06292',
          '#AED581',
          '#4DD0E1',
          '#BA68C8',
          '#FF8A65'
        ],
        borderWidth: 0,
      },
    ],
  };

  const categoryChartOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#666666',
          font: {
            size: 12
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Chart data for weekly activity
  const weeklyChartData = {
    labels: weeklyData.map(day => formatDate(day.date)),
    datasets: [
      {
        label: 'Виконані завдання',
        data: weeklyData.map(day => day.count),
        backgroundColor: '#7986CB',
        borderRadius: 4,
      },
    ],
  };

  const weeklyChartOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems: any) {
            return tooltipItems[0].label;
          },
          label: function(context: any) {
            return `Виконано: ${context.raw} завдань`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: '#666666',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        ticks: {
          color: '#666666',
        },
        grid: {
          display: false,
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Stat cards animation variant
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.div 
      className="analytics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="analytics-header">
        <h1>Аналітика та звітність</h1>
      </div>

      <div className="stats-cards">
        <motion.div 
          className="stat-card"
          variants={cardVariants}
          custom={0}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-card-inner">
            <div className="stat-number">{analytics.completedTasks}</div>
            <div className="stat-label">Виконано завдань</div>
          </div>
        </motion.div>
        
        <motion.div 
          className="stat-card"
          variants={cardVariants}
          custom={1}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-card-inner">
            <div className="stat-number">{analytics.pendingTasks}</div>
            <div className="stat-label">Очікують виконання</div>
          </div>
        </motion.div>
        
        <motion.div 
          className="stat-card"
          variants={cardVariants}
          custom={2}
          initial="hidden"
          animate="visible"
        >
          <div className="stat-card-inner">
            <div className="stat-number">{completionRate}%</div>
            <div className="stat-label">Рівень виконання</div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="analytics-row"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="chart-container weekly-chart-container">
          <h2>Тижнева активність</h2>
          <div className="chart-wrapper" style={{ height: "240px" }}>
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>
        
        <div className="chart-container category-chart-container">
          <h2>Розподіл за категоріями</h2>
          <div className="chart-wrapper" style={{ height: "240px" }}>
            <Doughnut data={categoryChartData} options={categoryChartOptions} />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="task-report"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="report-header">
          <h2>Звіт за період</h2>
          <div className="report-filters">
            <div className="filter-group">
              <label htmlFor="date-range">Період:</label>
              <select 
                id="date-range" 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'year')}
              >
                <option value="week">Тиждень</option>
                <option value="month">Місяць</option>
                <option value="year">Рік</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="category">Категорія:</label>
              <select 
                id="category" 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category === 'all' ? 'Всі категорії' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="report-summary">
          <div className="summary-section">
            <h3>Загальна інформація</h3>
            <ul className="summary-list">
              <li>
                <span>Всього завдань:</span>
                <span>{filteredTasks.length}</span>
              </li>
              <li>
                <span>Виконано:</span>
                <span>{completedFilteredTasks.length}</span>
              </li>
              <li>
                <span>Відсоток виконання:</span>
                <span>{filteredCompletionRate}%</span>
              </li>
            </ul>
          </div>
          
          <div className="summary-chart-container">
            <div className="doughnut-chart">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${filteredCompletionRate}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{filteredCompletionRate}%</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="report-tasks">
          <h3>Завдання за обраний період ({filteredTasks.length})</h3>
          
          {filteredTasks.length > 0 ? (
            <div className="task-list">
              {filteredTasks.map((task, index) => (
                <motion.div 
                  key={task.id} 
                  className={`task-item ${task.status}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="task-status-indicator"></div>
                  <div className="task-details">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="task-category">{task.category}</span>
                      <span className="task-date">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`task-priority ${task.priority}`}>
                        {task.priority === 'high' ? 'Високий' : 
                          task.priority === 'medium' ? 'Середній' : 'Низький'}
                      </span>
                    </div>
                  </div>
                  <div className="task-status">
                    {task.status === 'completed' ? 'Виконано' : 
                      task.status === 'in-progress' ? 'В процесі' : 'Очікує'}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-tasks-message">
              Немає завдань за обраний період та категорію
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsPage; 