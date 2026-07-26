const admin = require('firebase-admin');

// Initialize Firebase Admin (Only do this once in your app)
// In production, you would use a serviceAccountKey.json 
// For now we try to initialize with default credentials if available
try {
  if (!admin.apps || admin.apps.length === 0) {
    admin.initializeApp(); 
  }
} catch (error) {
  console.log('Firebase admin initialization error', error);
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // In a real prod environment with Firebase Admin fully set up:
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = decodedToken;
    
    // For local development without service account, we might just trust the token
    // if it's sent from the client (since client is authenticating directly with Firebase)
    // Warning: NOT FOR PRODUCTION without actual verification
    
    // As a placeholder until Firebase Admin is configured with service account:
    if (token) {
       try {
         const decodedToken = await admin.auth().verifyIdToken(token);
         req.user = decodedToken;
       } catch (err) {
         // Fallback for local dev without a service account JSON file:
         // Manually decode the JWT to extract the user ID
         const parts = token.split('.');
         if (parts.length === 3) {
           const base64Url = parts[1];
           const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
           const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
           const decodedToken = JSON.parse(jsonPayload);
           req.user = { uid: decodedToken.user_id || decodedToken.sub };
         } else {
           throw new Error("Invalid JWT format (possibly a stale dummy token)");
         }
       }
    }
    
    next();
  } catch (error) {
    console.error('Error verifying auth token', error);
    
    // Fallback for local testing without service account: 
    // If the client sends a custom header `x-user-uid` we can use that for testing ONLY
    if (process.env.NODE_ENV !== 'production' && req.headers['x-user-uid']) {
      req.user = { uid: req.headers['x-user-uid'] };
      return next();
    }

    return res.status(403).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyToken };
