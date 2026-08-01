const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  phone: { type: String },
  photoURL: { type: String },
  password: { type: String }, // Hashed password for staff login
  otpSecret: { type: String }, // TOTP secret for 2FA
  address: { type: String }, // Keep for backward compatibility or primary simple address
  addresses: [{
    type: { type: String, enum: ['Home', 'Work', 'Office', 'Other'], default: 'Home' },
    name: { type: String },
    phone: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  role: { type: String, enum: ['user', 'admin', 'super_admin', 'moderator'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
