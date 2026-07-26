const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../Frontend/.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const Product = require('./models/Product');
const Order = require('./models/Order');
const Chat = require('./models/Chat');
const Storefront = require('./models/Storefront');

const app = express();
const port = process.env.PORT || 5005;

// Allowed origins for CORS (Vercel domains can be added here)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB Atlas
const mongoURI = process.env.MONGODB_URI || process.env.MongoDB_URL || process.env.MONGODB_URL;
if (!mongoURI) {
  console.error("ERROR: No MongoDB connection string found in MONGODB_URI or MongoDB_URL environment variables!");
} else {
  mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// ========================
// IMPORT ROUTES
// ========================
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// ========================
// REGISTER ROUTES
// ========================
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);

// ========================
// ADMIN AUTH ENDPOINT
// ========================
app.post('/api/admin/login', (req, res) => {
  const { email, password, otp } = req.body;
  if (email === 'mahinasrafalom@gmail.com' && password === 'NexGenFood01') {
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const secret = process.env.ADMIN_2FA_SECRET;
    if (!secret) {
      console.error('ADMIN_2FA_SECRET is not defined in .env');
      return res.status(500).json({ success: false, message: 'Server configuration error (2FA)' });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: otp,
      window: 1 // allows 30 seconds before/after
    });

    if (verified) {
      const token = jwt.sign(
        { role: 'super_admin', email: 'mahinasrafalom@gmail.com' }, 
        process.env.JWT_SECRET || 'fallback_secret_key_123', 
        { expiresIn: '1d' }
      );
      return res.json({ success: true, token, message: 'Login successful' });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

// ========================
// PRODUCTS ENDPOINTS
// ========================
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    // Map _id to id for frontend compatibility
    const formattedProducts = products.map(p => ({ ...p.toObject(), id: p._id.toString() }));
    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // It's a valid 24-character hex string, so it must be an _id
      query = { _id: req.params.id };
    } else {
      // Fallback to searching by the custom id field if it exists
      query = { id: req.params.id };
    }
    const product = await Product.findOne(query);
    if (product) {
      res.json({ ...product.toObject(), id: product._id.toString() });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const productData = { ...req.body };
    delete productData._id;
    delete productData.id;
    delete productData.__v;
    delete productData.createdAt;
    delete productData.updatedAt;
    
    const newProduct = new Product({
      ...productData,
      status: productData.stock > 0 ? 'Active' : 'Out of Stock'
    });
    const savedProduct = await newProduct.save();
    res.json({ success: true, product: { ...savedProduct.toObject(), id: savedProduct._id.toString() }, message: "Product added successfully!" });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { id: req.params.id };
    }
    const deletedProduct = await Product.findOneAndDelete(query);
    if (deletedProduct) {
      res.json({ success: true, message: "Product deleted successfully!" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    updateData.status = updateData.stock > 0 ? 'Active' : 'Out of Stock';

    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { id: req.params.id };
    }

    const updatedProduct = await Product.findOneAndUpdate(
      query, 
      updateData, 
      { new: true }
    );
    if (updatedProduct) {
      res.json({ success: true, product: { ...updatedProduct.toObject(), id: updatedProduct._id.toString() }, message: "Product updated successfully!" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products/:id/reviews', async (req, res) => {
  try {
    const { user, rating, comment } = req.body;
    
    if (!user || !rating || !comment) {
      return res.status(400).json({ message: "User, rating, and comment are required" });
    }

    let query = {};
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query = { _id: req.params.id };
    } else {
      query = { id: req.params.id };
    }

    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newReview = {
      user,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };

    product.reviews.push(newReview);
    
    // Recalculate rating
    const totalRating = product.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    product.rating = totalRating / product.reviews.length;
    product.reviewCount = product.reviews.length;

    await product.save();
    
    res.json({ success: true, message: "Review added successfully", product: { ...product.toObject(), id: product._id.toString() } });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ========================
// ORDERS ENDPOINTS
// ========================
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderId = '#ORD-' + Math.floor(10000 + Math.random() * 90000);
    const newOrder = new Order({
      id: orderId,
      email: req.body.email || 'john.doe@example.com',
      customer: req.body.shippingAddress?.fullName || req.body.customer || 'Guest User',
      items: req.body.items || [],
      totalAmount: req.body.total || 0,
      total: `৳ ${req.body.total || 0}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Processing',
      paymentMethod: req.body.paymentMethod || 'cod',
      shippingAddress: req.body.shippingAddress || {}
    });
    await newOrder.save();
    res.json({ success: true, orderId, message: "Order placed successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// @route   GET /api/orders/my-orders
// @desc    Get logged in user's orders
// @access  Private
const { verifyToken } = require('./middleware/auth');
app.get('/api/orders/my-orders', verifyToken, async (req, res) => {
  try {
    // Usually req.user has email if decoded from Firebase, but if not we can look up the User
    const User = require('./models/User');
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const orders = await Order.find({ email: user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/user/:email', async (req, res) => {
  try {
    const orders = await Order.find({ email: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    
    if (order) {
      res.json({ success: true, message: `Order ${req.params.id} updated to ${status}` });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/track/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (order) {
      res.json({
        id: order.id,
        status: order.status,
        date: order.date,
        items: order.items,
        total: order.total,
        trackingNumber: 'TRK' + Math.floor(100000000 + Math.random() * 900000000)
      });
    } else {
      res.status(404).json({ message: "Invalid Order ID" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================
// CHAT ENDPOINTS
// ========================

// 1. Create a new chat session (User submits lead form)
app.post('/api/chats', async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const chat = new Chat({
      user: { fullName, phone }
    });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Get all chats (Admin Dashboard)
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Get a specific chat (User / Admin)
app.get('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    
    // Clear unread counts based on who is fetching (basic implementation)
    const { role } = req.query; // 'user' or 'admin'
    if (role === 'admin' && chat.unreadAdmin > 0) {
      chat.unreadAdmin = 0;
      await chat.save();
    } else if (role === 'user' && chat.unreadUser > 0) {
      chat.unreadUser = 0;
      await chat.save();
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Send a message to a chat (User / Admin)
app.post('/api/chats/:id/messages', async (req, res) => {
  try {
    const { sender, text, type = 'text', fileUrl } = req.body;
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const message = { sender, text, type, fileUrl, timestamp: new Date() };
    chat.messages.push(message);

    if (sender === 'user') {
      chat.unreadAdmin += 1;
    } else if (sender === 'admin') {
      chat.unreadUser += 1;
    }
    chat.status = 'active'; // Mark as active if it was closed

    await chat.save();
    
    // Auto-reply logic for the first user message
    if (sender === 'user' && chat.messages.length === 1) {
      setTimeout(async () => {
        try {
          const updatedChat = await Chat.findById(req.params.id);
          if (updatedChat) {
            updatedChat.messages.push({
              sender: 'admin',
              text: 'Thank you for reaching out. Please wait for a support team reply.',
              type: 'text',
              timestamp: new Date()
            });
            updatedChat.unreadUser += 1;
            await updatedChat.save();
          }
        } catch (e) {
          console.error('Auto-reply error:', e);
        }
      }, 1000);
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Upload file and send as message
app.post('/api/chats/:id/files', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { sender, type } = req.body; // type should be 'image', 'audio', or 'document'
    const fileUrl = `/uploads/${req.file.filename}`;
    
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    let text = req.body.text || '';

    const message = { sender, text, type, fileUrl, timestamp: new Date() };
    chat.messages.push(message);

    if (sender === 'user') {
      chat.unreadAdmin += 1;
    } else if (sender === 'admin') {
      chat.unreadUser += 1;
    }
    chat.status = 'active';

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================
// STOREFRONT ENDPOINTS
// ========================
app.get('/api/storefront', async (req, res) => {
  try {
    let storefront = await Storefront.findOne();
    if (!storefront) {
      storefront = new Storefront({ settings: {} });
      await storefront.save();
    }
    res.json(storefront.settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/storefront', async (req, res) => {
  try {
    let storefront = await Storefront.findOne();
    if (!storefront) {
      storefront = new Storefront({ settings: req.body });
    } else {
      storefront.settings = { ...storefront.settings, ...req.body };
    }
    await storefront.save();
    res.json({ success: true, message: "Storefront updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================
// DASHBOARD STATS
// ========================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const orders = await Order.find();
    const activeOrders = orders.filter(o => o.status === 'Processing').length;
    
    // Simplistic stats calculation for demonstration
    res.json({
      totalSales: '৳ 0', // To be dynamically calculated later
      activeOrders,
      totalCustomers: '0',
      totalRevenue: '৳ 0',
      recentOrders: orders.slice(0, 4)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
