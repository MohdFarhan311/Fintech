const express = require('express');
const router = express.Router();
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const { auth, merchantOnly } = require('../middleware/auth');

router.get('/dashboard', auth, merchantOnly, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ user: req.user._id }).select('-bankAccountNumber -ifscCode');
    res.json(merchant || null);
  } catch (err) { res.status(500).json({ error: 'Unable to load merchant profile' }); }
});
router.post('/profile', auth, merchantOnly, async (req, res) => {
  const { businessName, businessType, address, city, state, pincode, gstNumber } = req.body || {};
  if (typeof businessName !== 'string' || businessName.trim().length < 2 || businessName.trim().length > 120) return res.status(400).json({ error: 'Business name must be between 2 and 120 characters' });
  const fields = { businessName: businessName.trim() };
  for (const [key, value] of Object.entries({ businessType, address, city, state, pincode, gstNumber })) {
    if (value !== undefined) {
      if (typeof value !== 'string' || value.length > 160) return res.status(400).json({ error: `Invalid ${key}` });
      fields[key] = value.trim();
    }
  }
  try {
    const merchant = await Merchant.findOneAndUpdate({ user: req.user._id }, { $set: fields, $setOnInsert: { user: req.user._id } }, { new: true, upsert: true, runValidators: true }).select('-bankAccountNumber -ifscCode');
    res.json(merchant);
  } catch (err) { res.status(400).json({ error: 'Unable to save merchant profile. Check the supplied details.' }); }
});
router.get('/stats', auth, merchantOnly, async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ user: req.user._id });
    if (!merchant) return res.json({ planCount: 0, activePlans: 0, purchaseVolume: 0, outstandingBalance: 0, pilotStatus: 'pending' });
    const plans = await Transaction.find({ merchant: merchant._id }).select('status productPrice outstandingBalance');
    res.json({ planCount: plans.length, activePlans: plans.filter(p => p.status === 'active').length, purchaseVolume: plans.reduce((a,p)=>a+(p.productPrice||0),0), outstandingBalance: plans.reduce((a,p)=>a+(p.outstandingBalance||0),0), pilotStatus: merchant.pilotStatus });
  } catch (err) { res.status(500).json({ error: 'Unable to load merchant statistics' }); }
});
module.exports = router;
