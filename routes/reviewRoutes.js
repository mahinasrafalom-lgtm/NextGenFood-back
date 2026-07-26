const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/reviews/my-reviews
// @desc    Get user's product reviews
// @access  Private
router.get('/my-reviews', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reviews = await Review.find({ userEmail: user.email }).populate('productId', 'name images price');
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
