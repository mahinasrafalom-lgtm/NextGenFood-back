const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }],
  isApproved: { type: Boolean, default: true } // Admin can un-approve bad reviews
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
