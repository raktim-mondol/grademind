const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Middleware to verify authentication (assuming you have one, or we can use a mock)
// For now, we'll assume the main server.js applies auth middleware generally, 
// OR we should import the Clerk middleware here if needed.
// Checking server.js... imports are usually passed down.

// IMPORTANT: Webhooks need raw body, so we might need to handle that in server.js 
// or use a specific middleware here before the global JSON parser if possible.
// However, since we define routes here, the body parsing usually happens before.
// We will address body parsing in server.js.

router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Webhook route defined here, but might need special body parsing handling in server.js
// effectively we will mount this router *after* the raw parser if we want to be clean,
// Verify session (frontend calls this after redirect)
router.get('/verify-session', paymentController.verifyCheckoutSession);

// Webhook endpoint (Must be raw body - handled in server.js middleware)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
