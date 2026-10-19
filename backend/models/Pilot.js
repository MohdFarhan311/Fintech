const mongoose = require('mongoose');

const pilotSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    businessType: { type: String },
    city: { type: String },
    monthlyRevenue: { type: String },
    currentEmiProvider: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pilot', pilotSchema);
