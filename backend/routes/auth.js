const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const generateToken = id => {
  if (!process.env.JWT_SECRET) throw new Error('Authentication is not configured');
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) return res.status(400).json({ error: 'Enter a name between 2 and 100 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) return res.status(400).json({ error: 'Enter a valid email address' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
    if (role && !['customer', 'merchant'].includes(role)) return res.status(400).json({ error: 'Choose a valid account type' });
    if (phone != null && (typeof phone !== 'string' || phone.length > 30)) return res.status(400).json({ error: 'Phone number is invalid' });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, phone: phone?.trim(), password, role: role || 'customer' });
    res.status(201).json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'Please check your account details' });
    res.status(500).json({ error: 'Unable to create account right now' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: generateToken(user._id), user: publicUser(user) });
  } catch (err) { res.status(500).json({ error: 'Unable to sign in right now' }); }
});

router.get('/me', auth, (req, res) => res.json(publicUser(req.user)));
module.exports = router;
