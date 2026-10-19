const express = require('express');
const router = express.Router();
const Pilot = require('../models/Pilot');
router.post('/', async (req, res) => {
  const input = req.body || {};
  const required = ['businessName','ownerName','email','phone'];
  for (const key of required) if (typeof input[key] !== 'string' || !input[key].trim()) return res.status(400).json({ error: `${key} is required` });
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  const fields = {};
  for (const key of ['businessName','ownerName','email','phone','businessType','city','monthlyRevenue','currentEmiProvider','message']) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string' || input[key].length > 300) return res.status(400).json({ error: `Invalid ${key}` });
      fields[key] = input[key].trim();
    }
  }
  fields.email = email;
  try { const pilot = await Pilot.create(fields); res.status(201).json({ success: true, message: 'Enquiry received', id: pilot._id }); }
  catch (err) { res.status(400).json({ error: 'Unable to submit your enquiry. Check the supplied details.' }); }
});
router.get('/count', async (req, res) => {
  try { res.json({ count: await Pilot.countDocuments() }); }
  catch (err) { res.status(500).json({ error: 'Unable to load enquiry count' }); }
});
module.exports = router;
