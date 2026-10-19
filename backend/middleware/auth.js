const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    if (!process.env.JWT_SECRET) return res.status(503).json({ error: 'Authentication is not configured on this server' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const merchantOnly = (req, res, next) => {
  if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Merchant access required' });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { auth, merchantOnly, adminOnly };
