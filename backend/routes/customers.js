const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { randomUUID } = require('crypto');

const transactionSummary = plan => ({
  _id: plan._id,
  productName: plan.productName,
  productPrice: plan.productPrice,
  pool2Amount: plan.pool2Amount,
  totalMonths: plan.totalMonths,
  paidMonths: plan.paidMonths,
  outstandingBalance: plan.outstandingBalance,
  status: plan.status,
  nextDebitDate: plan.nextDebitDate,
});

function addMonths(date, count) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + count);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

router.get('/dashboard', auth, async (req, res) => {
  if (req.user.role !== 'customer' && req.user.role !== 'admin') return res.status(403).json({ error: 'Customer access required' });
  try {
    const transactions = await Transaction.find({ customer: req.user._id }).select('-cardLast4 -cardBank').populate('merchant', 'businessName city').sort('-createdAt');
    const totalOutstanding = transactions.reduce((acc, item) => acc + (item.outstandingBalance || 0), 0);
    res.json({ transactions, totalOutstanding, activeCount: transactions.filter(item => item.status === 'active').length });
  } catch (err) { res.status(500).json({ error: 'Unable to load customer plans' }); }
});

// Demo-only payment simulation. This route never contacts or represents a payment provider.
router.post('/pay/:transactionId', auth, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer access required' });
  if (!/^[a-f\d]{24}$/i.test(req.params.transactionId)) return res.status(400).json({ error: 'Invalid plan ID' });
  const amount = req.body?.amount;
  const outcome = req.body?.outcome;
  const idempotencyKey = req.body?.idempotencyKey;
  if (!Number.isSafeInteger(amount) || amount < 1) return res.status(400).json({ error: 'Enter a valid whole-number payment amount' });
  if (!['success', 'failure'].includes(outcome)) return res.status(400).json({ error: 'Choose a demo payment outcome' });
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) return res.status(400).json({ error: 'A valid payment request key is required' });

  try {
    const ownership = { _id: req.params.transactionId, customer: req.user._id };
    const plan = await Transaction.findOne(ownership).select('customer productName productPrice pool2Amount totalMonths paidMonths outstandingBalance status nextDebitDate paymentHistory');
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const prior = plan.paymentHistory.find(item => item.idempotencyKey === idempotencyKey);
    if (prior) {
      if (prior.amount !== amount || (prior.status === 'paid' ? 'success' : 'failure') !== outcome) return res.status(409).json({ error: 'This request key was already used for a different payment' });
      return res.json({ duplicate: true, payment: prior, transaction: transactionSummary(plan) });
    }
    if (plan.status !== 'active' || plan.outstandingBalance <= 0) return res.status(409).json({ error: 'This plan is not eligible for a demo payment' });
    if (!Number.isSafeInteger(plan.outstandingBalance)) return res.status(409).json({ error: 'This plan balance is invalid and cannot be paid' });
    if (amount > plan.outstandingBalance) return res.status(400).json({ error: 'Payment amount cannot exceed the current outstanding balance' });

    const paid = outcome === 'success';
    const now = new Date();
    const reference = `DEMO-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
    const payment = { amount, date: now, status: paid ? 'paid' : 'failed', idempotencyKey, reference };
    const update = paid
      ? (() => {
        const balance = plan.outstandingBalance - amount;
        const totalMonths = plan.totalMonths || 1;
        const installment = Math.max(1, plan.pool2Amount || Math.ceil(plan.productPrice / totalMonths));
        const paidMonths = balance === 0 ? totalMonths : Math.max(plan.paidMonths || 0, totalMonths - Math.ceil(balance / installment));
        const monthsCovered = Math.max(0, paidMonths - (plan.paidMonths || 0));
        return [{ $set: {
          outstandingBalance: balance,
          paidMonths,
          status: balance === 0 ? 'completed' : 'active',
          nextDebitDate: balance === 0 ? null : (monthsCovered ? addMonths(plan.nextDebitDate || now, monthsCovered) : (plan.nextDebitDate || addMonths(now, 1))),
          paymentHistory: { $concatArrays: [{ $ifNull: ['$paymentHistory', []] }, { $literal: [payment] }] },
        } }];
      })()
      : [{ $set: { paymentHistory: { $concatArrays: [{ $ifNull: ['$paymentHistory', []] }, { $literal: [payment] }] } } }];

    // One atomic document update guards balance, ownership, eligibility, and duplicate submission.
    const updated = await Transaction.findOneAndUpdate({
      ...ownership,
      status: 'active',
      outstandingBalance: plan.outstandingBalance,
      'paymentHistory.idempotencyKey': { $ne: idempotencyKey },
    }, update, { new: true }).select('productName productPrice pool2Amount totalMonths paidMonths outstandingBalance status nextDebitDate paymentHistory');

    if (!updated) {
      const latest = await Transaction.findOne(ownership).select('productName productPrice pool2Amount totalMonths paidMonths outstandingBalance status nextDebitDate paymentHistory');
      if (!latest) return res.status(404).json({ error: 'Plan not found' });
      const replay = latest.paymentHistory.find(item => item.idempotencyKey === idempotencyKey);
      if (replay) {
        if (replay.amount !== amount || (replay.status === 'paid' ? 'success' : 'failure') !== outcome) return res.status(409).json({ error: 'This request key was already used for a different payment' });
        return res.json({ duplicate: true, payment: replay, transaction: transactionSummary(latest) });
      }
      return res.status(409).json({ error: 'The plan changed while this request was being processed. Refresh and try again.' });
    }
    const recorded = updated.paymentHistory.find(item => item.idempotencyKey === idempotencyKey);
    return res.status(201).json({ duplicate: false, payment: recorded, transaction: transactionSummary(updated) });
  } catch (err) { return res.status(500).json({ error: 'Unable to record the demo payment attempt' }); }
});
module.exports = router;
