const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/tickets
// @desc    Get all tickets for logged in user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tickets = await Ticket.find({ userEmail: user.email }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tickets
// @desc    Create a new support ticket
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { title, topic, description, photoUrl } = req.body;
    
    if (!title || !topic || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTicket = new Ticket({
      userEmail: user.email,
      title,
      topic,
      description,
      photoUrl
    });

    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tickets/all
// @desc    Get all support tickets (Admin)
// @access  Private/Admin
router.get('/all', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tickets/:id
// @desc    Update ticket status or add response (Admin/User)
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { status, responseMessage, sender } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (responseMessage && sender) {
      ticket.responses.push({ sender, message: responseMessage });
    }

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
