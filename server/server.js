const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { connectDB, isConnected } = require('./config/db');
const { initRedis } = require('./config/redis');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// Import queue configuration
const {
  assignmentProcessingQueue,
  rubricProcessingQueue,
  solutionProcessingQueue,
  submissionProcessingQueue,
  evaluationQueue
} = require('./config/queue');

// Load environment variables
dotenv.config();

console.log('🔍 Checking Environment Variables:');
console.log('   - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Loaded (starts with ' + process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...)' : 'MISSING');
console.log('   - CLIENT_URL:', process.env.CLIENT_URL);

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize Redis for caching
initRedis();

// Middlewares
app.use(cors());

// Use raw parser for webhook signatures BEFORE global JSON parser
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for API routes
app.use('/api', (req, res, next) => {
  if (!isConnected()) {
    console.warn(`Database not connected for ${req.method} ${req.path}`);
    // Don't block all requests, just log warning
    // Some operations might work without database
  }
  next();
});

// Clerk authentication middleware (optional auth - populates req.auth when token present)
// Only enable if CLERK_SECRET_KEY is configured
if (process.env.CLERK_SECRET_KEY) {
  app.use('/api', ClerkExpressWithAuth());
  console.log('✅ Clerk authentication middleware enabled');

  // Sync Clerk user with MongoDB user
  app.use('/api', require('./middleware/syncUser'));
  console.log('✅ User sync middleware enabled');
} else {
  console.log('⚠️  Clerk authentication disabled - running in development mode');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure project submission directories exist


// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define API routes
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));

app.use('/api/grademind', require('./routes/grademind'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/payments', require('./routes/payments'));

// Base route
app.get('/', (req, res) => {
  res.send('Assignment Evaluation System API is running');
});

// Start worker processes
if (process.env.NODE_ENV !== 'test') {
  // Load queue processors
  require('./workers/assignmentProcessor');
  require('./workers/rubricProcessor');
  require('./workers/solutionProcessor');
  require('./workers/submissionProcessor');
  require('./workers/evaluationProcessor');

  require('./workers/orchestrationProcessor'); // Added orchestration processor

  console.log('Document processing workers initialized');
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Send all other requests to the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Define port for the server
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});