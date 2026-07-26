const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'audio', 'document', 'video'], default: 'text' },
  fileUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  user: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true }
  },
  messages: [messageSchema],
  unreadAdmin: { type: Number, default: 0 },
  unreadUser: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
