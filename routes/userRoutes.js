const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/profile
// @desc    Create user profile (usually called after Firebase signup)
// @access  Private
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const { email, name, phone, photoURL } = req.body;
    
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (user) {
      // Return 200 OK so that Google Login doesn't fail for returning users
      return res.status(200).json(user);
    }
    
    user = new User({
      firebaseUid: req.user.uid,
      email: email || req.user.email,
      name,
      phone,
      photoURL
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, address, photoURL } = req.body;
    
    let user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (photoURL) user.photoURL = photoURL;
    
    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========================
// WISHLIST ENDPOINTS
// ========================

// @route   GET /api/users/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/wishlist', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/wishlist
// @desc    Toggle item in wishlist
// @access  Private
router.post('/wishlist', verifyToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID is required' });

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.wishlist.indexOf(productId);
    let isAdded = false;
    
    if (index === -1) {
      user.wishlist.push(productId);
      isAdded = true;
    } else {
      user.wishlist.splice(index, 1);
    }
    
    await user.save();
    res.json({ success: true, isAdded, wishlist: user.wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========================
// ADDRESS ENDPOINTS
// ========================

// @route   GET /api/users/addresses
// @desc    Get user's addresses
// @access  Private
router.get('/addresses', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/addresses
// @desc    Add a new address
// @access  Private
router.post('/addresses', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAddress = { ...req.body };
    
    // If it's the first address or marked as default, unset other defaults
    if (user.addresses.length === 0 || newAddress.isDefault) {
      newAddress.isDefault = true;
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update an address
// @access  Private
router.put('/addresses/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.id);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    // Update fields
    Object.keys(req.body).forEach(key => {
      address[key] = req.body[key];
    });

    // Handle default logic
    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== req.params.id) {
          addr.isDefault = false;
        }
      });
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete an address
// @access  Private
router.delete('/addresses/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses.pull(req.params.id);
    
    // If we deleted the default address, make the first remaining one default
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin)
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    
    if (type === 'customer') {
      // Customers are strictly users with role 'user' or no role
      query = { $or: [{ role: 'user' }, { role: { $exists: false } }, { role: null }] };
    } else if (type === 'staff') {
      // Staff strictly includes these specific admin roles
      query = { role: { $in: ['super_admin', 'admin', 'moderator'] } };
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/admin-create
// @desc    Create a new staff user from the Admin panel
// @access  Admin
router.post('/admin-create', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const bcrypt = require('bcryptjs');
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');

    // Validate
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!['admin', 'moderator', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists as staff
    const existing = await User.findOne({ email });
    if (existing && ['admin', 'moderator', 'super_admin'].includes(existing.role)) {
      return res.status(400).json({ message: 'A staff member with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP secret for 2FA
    const secret = speakeasy.generateSecret({
      name: `NextPetFood (${email})`,
      issuer: 'NextPetFood Admin'
    });

    let newUser;

    if (existing) {
      // Promote existing customer to staff
      existing.name = name;
      existing.password = hashedPassword;
      existing.otpSecret = secret.base32;
      existing.role = role;
      existing.status = 'active';
      await existing.save();
      newUser = existing;
    } else {
      // Create brand new user
      newUser = new User({
        email,
        name,
        password: hashedPassword,
        otpSecret: secret.base32,
        role,
        status: 'active'
      });
      await newUser.save();
    }

    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(201).json({
      user: newUser,
      otpSecret: secret.base32,
      otpQrCode: qrDataUrl,
      message: 'Staff member created. Share the QR code or secret key with them to set up their authenticator app.'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists in Database.' });
    }
    res.status(500).json({ message: 'Server error while saving user.' });
  }
});

// @route   DELETE /api/users/admin/:id
// @desc    Delete a user (Admin)
// @access  Admin
router.delete('/admin/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/admin/:id
// @desc    Update a user (Admin)
// @access  Admin
router.put('/admin/:id', async (req, res) => {
  try {
    const { name, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (role) user.role = role;
    
    // If we need to sync with firebase admin, we can do it here, but skipping for now
    // to avoid firebase admin errors if not configured.
    
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

