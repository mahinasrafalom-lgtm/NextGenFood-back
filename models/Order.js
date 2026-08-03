const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  email: { type: String, required: true, default: 'john.doe@example.com' }, // Hardcoded user linking for now
  customer: { type: String, default: 'Guest User' },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],
  totalAmount: { type: Number, default: 0 },
  total: { type: String, default: '৳ 0' }, // Legacy string representation
  date: { type: String },
  status: { type: String, default: 'Processing' },
  paymentMethod: { type: String, default: 'cod' },
  shippingAddress: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    district: String,
    thana: String
  },
  billingAddress: {
    fullName: String,
    phone: String,
    email: String,
    address: String,
    district: String,
    thana: String
  },
  cancelReason: { type: String },
  transactionId: { type: String },
  paymentScreenshot: { type: String },
  paymentStatus: { type: String, default: 'Pending' },
  rewardItem: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
