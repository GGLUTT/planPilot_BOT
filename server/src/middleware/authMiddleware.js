const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Check authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      message: 'Необхідна авторизація для доступу'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Невірний токен авторизації'
    });
  }
};

// Alias for protect (for compatibility)
exports.authenticateToken = exports.protect;

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role) {
      return res.status(403).json({
        message: `Роль користувача ${req.user.role} не має доступу до цього ресурсу`
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Роль користувача ${req.user.role} не має доступу до цього ресурсу`
      });
    }
    
    next();
  };
}; 