const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/coupons
// @desc    Get available coupons
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Fetch active coupons
    const coupons = await Coupon.find({ isActive: true });
    
    // Determine which ones are available vs applied(used) by this user
    const available = coupons.filter(c => !c.usedBy.includes(user.email));
    const applied = coupons.filter(c => c.usedBy.includes(user.email));

    res.json({ available, applied });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/coupons/all
// @desc    Get all coupons (Admin)
// @access  Admin
router.get('/all', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/coupons
// @desc    Create a new coupon (Admin)
// @access  Private/Admin
router.post('/', verifyToken, async (req, res) => {
  try {
    const { code, title, description, discountPercentage, discountAmount, validUntil, isActive } = req.body;
    const newCoupon = new Coupon({
      code, title, description, discountPercentage, discountAmount, validUntil, isActive
    });
    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/coupons/:id
// @desc    Update coupon (Admin)
// @access  Private/Admin
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon (Admin)
// @access  Private/Admin
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
