const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  discountPercentage: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  targetAudience: { 
    type: String, 
    enum: ['all', 'new_user', 'loyal_customer'], 
    default: 'all' 
  },
  minPurchasesRequired: { type: Number, default: 0 },
  usedBy: [{ type: String }] // Array of user emails who have used it
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
