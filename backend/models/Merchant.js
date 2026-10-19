const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true },
    businessType: { type: String },
    gstNumber: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    bankAccountNumber: { type: String },
    ifscCode: { type: String },
    pilotStatus: {
      type: String,
      enum: ['pending', 'active', 'completed', 'rejected'],
      default: 'pending',
    },
    pilotStartDate: { type: Date },
    pilotEndDate: { type: Date },
    monthlyTransactionVolume: { type: Number, default: 0 },
    workingCapitalBalance: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Merchant', merchantSchema);
