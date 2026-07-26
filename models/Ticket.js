const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  photoUrl: { type: String }, // Optional attachment
  status: { type: String, enum: ['Open', 'Pending', 'Closed'], default: 'Open' },
  responses: [{
    sender: { type: String, enum: ['user', 'admin'] },
    message: { type: String },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
