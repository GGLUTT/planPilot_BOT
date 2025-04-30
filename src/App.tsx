import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import WelcomeScreen from './components/WelcomeScreen';
import FeaturesScreen from './components/FeaturesScreen';
import TaskApp from './components/TaskApp';
import AnalyticsPage from './components/AnalyticsPage';
import ProfilePage from './components/ProfilePage';
import BottomNavbar from './components/BottomNavbar';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/features" element={<FeaturesScreen />} />
          <Route path="/app" element={<TaskApp />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Show bottom navbar on specific pages only */}
        {window.location.hash !== '#/' && window.location.hash !== '#/features' && (
          <BottomNavbar />
        )}
      </div>
    </Router>
  );
}

export default App;
