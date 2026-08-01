const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const Review = require('./models/Review');
const User = require('./models/User');

const mongoURI = process.env.MONGODB_URI || process.env.MongoDB_URL || process.env.MONGODB_URL;

async function run() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB.");
    
    const reviews = await Review.find({});
    console.log("Total reviews in Review collection:", reviews.length);
    
    const productsWithReviews = await Product.find({ "reviews.0": { $exists: true } });
    let embeddedReviewCount = 0;
    productsWithReviews.forEach(p => {
      embeddedReviewCount += p.reviews.length;
    });
    console.log("Total embedded reviews in Product collection:", embeddedReviewCount);
    
    // Attempt to migrate
    if (embeddedReviewCount > reviews.length) {
      console.log("Migrating reviews...");
      for (const p of productsWithReviews) {
        for (const rev of p.reviews) {
          // Check if already exists by checking same productId, rating, comment
          const exists = await Review.findOne({
            productId: p._id,
            comment: rev.comment
          });
          if (!exists) {
            // Find a user email
            let userEmail = "ashrafmlom17@gmail.com"; // Default for testing if we can't find it
            // Try to find if we have a user with this name
            const u = await User.findOne({ name: rev.user });
            if (u) {
              userEmail = u.email;
            }
            
            await Review.create({
              userEmail: userEmail,
              productId: p._id,
              rating: rev.rating,
              comment: rev.comment,
              isApproved: true,
              createdAt: rev.createdAt
            });
            console.log(`Migrated review from ${rev.user}`);
          }
        }
      }
    }
    console.log("Done.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
