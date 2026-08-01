const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');

// @route   GET /api/coupons
// @desc    Get available coupons
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Fetch active coupons
    const coupons = await Coupon.find({ isActive: true });
    
    // Check how many orders this user has placed to determine eligibility
    const orderCount = await Order.countDocuments({ email: user.email });
    
    // Filter coupons based on target audience rules
    const eligibleCoupons = coupons.filter(c => {
      if (c.targetAudience === 'new_user') {
        return orderCount === 0;
      }
      if (c.targetAudience === 'loyal_customer') {
        return orderCount >= (c.minPurchasesRequired || 0);
      }
      // 'all' or undefined
      return true;
    });
    
    // Determine which ones are available vs applied(used) by this user
    const available = eligibleCoupons.filter(c => !c.usedBy.includes(user.email));
    const applied = eligibleCoupons.filter(c => c.usedBy.includes(user.email));

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
    const { code, title, description, discountPercentage, discountAmount, validUntil, isActive, targetAudience, minPurchasesRequired } = req.body;
    const newCoupon = new Coupon({
      code, title, description, discountPercentage, discountAmount, validUntil, isActive, targetAudience, minPurchasesRequired
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
