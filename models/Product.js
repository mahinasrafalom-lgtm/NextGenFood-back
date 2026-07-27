const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String },
  priceMin: { type: Number, required: true },
  priceMax: { type: Number },
  price: { type: Number },
  discount: { type: String },
  image: { type: String },
  images: [{ type: String }],
  brand: { type: String },
  brandImage: { type: String },
  stock: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  isTopSale: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  reviews: [{
    user: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
