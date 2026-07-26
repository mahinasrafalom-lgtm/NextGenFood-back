const mongoose = require('mongoose');

const storefrontSchema = new mongoose.Schema({
  // Use a flexible schema for Storefront since it can contain various settings (hero banner, promos, etc.)
  settings: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Storefront', storefrontSchema);
