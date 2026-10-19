const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true },
    pool1Amount: { type: Number }, // Security deposit (product price)
    pool2Amount: { type: Number }, // Monthly EMI amount
    totalMonths: { type: Number, default: 12 },
    paidMonths: { type: Number, default: 0 },
    outstandingBalance: { type: Number },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'defaulted'],
      default: 'active',
    },
    nextDebitDate: { type: Date },
    paymentHistory: [
      {
        month: Number,
        amount: Number,
        date: Date,
        status: { type: String, enum: ['paid', 'failed', 'skipped', 'pending'] },
        idempotencyKey: { type: String },
        reference: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
