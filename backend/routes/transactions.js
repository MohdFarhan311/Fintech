const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');
const User = require('../models/User');
const { auth, merchantOnly } = require('../middleware/auth');

router.post('/', auth, merchantOnly, async (req, res) => {
  const { customerEmail, productName, productPrice, totalMonths } = req.body || {};
  const email = typeof customerEmail === 'string' ? customerEmail.trim().toLowerCase() : '';
  const price = Number(productPrice); const months = Number(totalMonths);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid customer email' });
  if (typeof productName !== 'string' || productName.trim().length < 2 || productName.trim().length > 120) return res.status(400).json({ error: 'Product name must be between 2 and 120 characters' });
  if (!Number.isSafeInteger(price) || price < 1 || price > 10000000) return res.status(400).json({ error: 'Purchase amount must be a whole number between 1 and 10,000,000' });
  if (![3,6,9,12,18,24].includes(months)) return res.status(400).json({ error: 'Choose a supported plan duration' });
  try {
    const [customer, merchant] = await Promise.all([User.findOne({ email, role: 'customer' }).select('_id'), Merchant.findOne({ user: req.user._id })]);
    if (!customer) return res.status(404).json({ error: 'Customer account not found' });
    if (!merchant) return res.status(409).json({ error: 'Complete your merchant business profile before creating plan records' });
    const transaction = await Transaction.create({ merchant: merchant._id, customer: customer._id, productName: productName.trim(), productPrice: price, pool1Amount: 0, pool2Amount: Math.ceil(price / months), totalMonths: months, outstandingBalance: price, nextDebitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    res.status(201).json(transaction);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ error: 'Plan details are invalid' });
    res.status(500).json({ error: 'Unable to create plan record' });
  }
});
router.get('/', auth, merchantOnly, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ user: req.user._id });
    if (!merchant) return res.json([]);
    const transactions = await Transaction.find({ merchant: merchant._id }).select('-cardLast4 -cardBank').populate('customer', 'name email').sort('-createdAt');
    res.json(transactions);
  } catch (err) { res.status(500).json({ error: 'Unable to load plan records' }); }
});
module.exports = router;
