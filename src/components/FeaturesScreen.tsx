import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/FeaturesScreen.css';

const FeatureCard: React.FC<{ 
  icon: string, 
  title: string, 
  description: string,
  delay: number
}> = ({ icon, title, description, delay }) => {
  return (
    <motion.div 
      className="feature-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
};

const FeaturesScreen: React.FC = () => {
  const features = [
    {
      icon: '✅',
      title: 'Керування завданнями',
      description: 'Створюйте та керуйте вашими цілями і завданнями в одному місці'
    },
    {
      icon: '🔍',
      title: 'Фільтрація',
      description: 'Фільтруйте завдання за категоріями та статусом для кращої організації'
    },
    {
      icon: '🎯',
      title: 'Пріоритети',
      description: 'Встановлюйте пріоритети для ваших завдань, щоб фокусуватися на важливому'
    },
    {
      icon: '📱',
      title: 'Адаптивний дизайн',
      description: 'Використовуйте на будь-якому пристрої – мобільному або комп\'ютері'
    },
    {
      icon: '🌓',
      title: 'Темна і світла тема',
      description: 'Комфортне використання вдень та вночі з підтримкою світлої та темної теми'
    },
    {
      icon: '📊',
      title: 'Прогрес',
      description: 'Відстежуйте прогрес виконання ваших завдань і святкуйте досягнення'
    }
  ];

  return (
    <div className="features-container">
      <motion.div 
        className="features-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Можливості PlanPilot</h1>
        <p>Відкрийте для себе всі функції, які допоможуть вам бути продуктивнішими</p>
      </motion.div>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={0.2 + index * 0.1}
          />
        ))}
      </div>
      
      <motion.div 
        className="features-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Link to="/app" className="start-button">
          Почати користуватися
        </Link>
      </motion.div>
    </div>
  );
};

export default FeaturesScreen; 