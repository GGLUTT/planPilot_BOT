import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  useEffect(() => {
    // Add this class to change body background for welcome screen
    document.body.classList.add('welcome-page');
    
    // Clean up
    return () => {
      document.body.classList.remove('welcome-page');
    };
  }, []);

  return (
    <div className="welcome-container">
      <motion.div 
        className="welcome-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="logo-container"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 0.3,
            type: "spring",
            stiffness: 200
          }}
        >
          <div className="app-logo">🎯</div>
          <h1 className="app-name">PlanPilot</h1>
        </motion.div>
        
        <motion.p 
          className="welcome-tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Вітаємо у вашому особистому помічнику планування
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <Link to="/features" className="welcome-button">
            Почати
          </Link>
        </motion.div>
      </motion.div>
      
      <div className="wave-container">
        <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#4a6bff" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,202.7C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default WelcomeScreen; 