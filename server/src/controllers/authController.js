const User = require('../models/User');

/**
 * Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      createdAt: new Date()
    });
    
    // Generate token
    const token = user.getSignedJwtToken();
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Помилка сервера при реєстрації', error: error.message });
  }
};

/**
 * Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Будь ласка, введіть email та пароль' });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Невірні дані для входу' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Невірні дані для входу' });
    }
    
    // Generate token
    const token = user.getSignedJwtToken();
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Помилка сервера при вході', error: error.message });
  }
};

/**
 * Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
        subscription: user.subscription,
        telegramConnected: user.telegram.isConnected,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Помилка сервера при отриманні профілю', error: error.message });
  }
};

/**
 * Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };
    
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        theme: user.theme,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ message: 'Помилка сервера при оновленні даних', error: error.message });
  }
};

/**
 * Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Check required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Будь ласка, введіть поточний та новий паролі' });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Поточний пароль невірний' });
    }
    
    // Set new password
    user.password = newPassword;
    await user.save();
    
    // Generate new token
    const token = user.getSignedJwtToken();
    
    res.json({
      success: true,
      token,
      message: 'Пароль успішно змінено'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Помилка сервера при оновленні пароля', error: error.message });
  }
}; 