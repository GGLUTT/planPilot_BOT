import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import storageService, { UserProfile } from '../services/storageService';
import '../styles/ProfilePage.css';

const DEFAULT_AVATARS = [
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
  'https://www.gravatar.com/avatar/11111111111111111111111111111111?d=identicon&f=y',
  'https://www.gravatar.com/avatar/22222222222222222222222222222222?d=monsterid&f=y',
  'https://www.gravatar.com/avatar/33333333333333333333333333333333?d=wavatar&f=y',
  'https://www.gravatar.com/avatar/44444444444444444444444444444444?d=retro&f=y',
  'https://www.gravatar.com/avatar/55555555555555555555555555555555?d=robohash&f=y',
];

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(storageService.getUserProfile());
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formName, setFormName] = useState(profile.name);
  const [formEmail, setFormEmail] = useState(profile.email);

  useEffect(() => {
    // Save profile whenever it changes
    storageService.saveUserProfile(profile);
  }, [profile]);

  const handleAvatarSelect = (avatar: string) => {
    setProfile({...profile, avatar});
    setAvatarMenuOpen(false);
  };

  const handleCustomAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAvatarUrl.trim()) {
      setProfile({...profile, avatar: customAvatarUrl});
      setAvatarMenuOpen(false);
      setCustomAvatarUrl('');
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: formName,
      email: formEmail,
    });
    setEditMode(false);
  };

  return (
    <motion.div 
      className="profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="profile-header">
        <h1>Мій профіль</h1>
      </div>

      <div className="profile-card">
        <div className="avatar-section">
          <div 
            className="avatar-container"
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
          >
            <img 
              src={profile.avatar} 
              alt="Avatar" 
              className="profile-avatar"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
              }}
            />
            <div className="avatar-edit-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          </div>

          {avatarMenuOpen && (
            <motion.div 
              className="avatar-menu"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="avatar-options">
                {DEFAULT_AVATARS.map((avatar, index) => (
                  <img 
                    key={index}
                    src={avatar}
                    alt={`Avatar option ${index + 1}`}
                    onClick={() => handleAvatarSelect(avatar)}
                    className="avatar-option"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                    }}
                  />
                ))}
              </div>
              
              <div className="custom-avatar-section">
                <form onSubmit={handleCustomAvatarSubmit}>
                  <input
                    type="text"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="Введіть URL зображення"
                  />
                  <button type="submit">Встановити</button>
                </form>
              </div>
              
              <button 
                className="close-avatar-menu"
                onClick={() => setAvatarMenuOpen(false)}
              >
                Закрити
              </button>
            </motion.div>
          )}
        </div>

        {!editMode ? (
          <div className="profile-info">
            <h2>{profile.name}</h2>
            {profile.email && <p className="profile-email">{profile.email}</p>}
            <p className="profile-member-since">Учасник з {new Date(profile.createdAt).toLocaleDateString()}</p>
            
            <button 
              className="edit-profile-button"
              onClick={() => setEditMode(true)}
            >
              Редагувати профіль
            </button>
          </div>
        ) : (
          <motion.div 
            className="profile-edit-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="name">Ім'я</label>
                <input
                  type="text"
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Електронна пошта</label>
                <input
                  type="email"
                  id="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-button">Зберегти</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setEditMode(false);
                    setFormName(profile.name);
                    setFormEmail(profile.email);
                  }}
                >
                  Скасувати
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      <div className="profile-preferences">
        <h3>Налаштування</h3>
        <div className="preference-item">
          <span>Темна тема</span>
          <div 
            className={`theme-toggle ${profile.theme === 'dark' ? 'active' : ''}`}
            onClick={() => {
              const newTheme = profile.theme === 'dark' ? 'light' : 'dark';
              setProfile({...profile, theme: newTheme});
              document.body.classList.toggle('dark-mode', newTheme === 'dark');
              storageService.saveThemePreference(newTheme);
            }}
          >
            <div className="toggle-handle"></div>
          </div>
        </div>
      </div>

      <div className="app-info">
        <h3>Про додаток</h3>
        <p>PlanPilot v1.0.0</p>
        <p>Ваш особистий помічник у плануванні завдань та досягненні цілей</p>
      </div>
    </motion.div>
  );
};

export default ProfilePage; 