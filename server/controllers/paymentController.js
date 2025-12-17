const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user');

// Create a checkout session
exports.createCheckoutSession = async (req, res) => {
    try {
        console.log('💳 createCheckoutSession called');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);

        // Check if user is authenticated
        if (!req.user || !req.user.clerkId) {
            console.error('❌ User not authenticated or Clerk ID missing in req.user');
            console.log('req.user:', req.user);
            console.log('req.auth:', req.auth);
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { packageType } = req.body;
        const userId = req.user.clerkId;
        console.log(`Processing checkout for user: ${userId}, package: ${packageType}`);

        if (!packageType) {
            return res.status(400).json({ error: 'Package type is required' });
        }

        // Check if Stripe is initialized
        if (!stripe) {
            console.error('❌ Stripe client not initialized. Check STRIPE_SECRET_KEY.');
            return res.status(500).json({ error: 'Payment service configuration error' });
        }

        const prices = {
            pro: 'price_1QcrfCGWCD6k4559x8UuV30g',
        };

        // ... rest of logic

        const productDetails = {
            name: 'Pro Educator Plan',
            description: 'Upgrade to Pro Educator Plan',
            amount: 1900, // $19.00 in cents
            currency: 'usd',
        };

        console.log('Creating Stripe session...');

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: productDetails.currency,
                        product_data: {
                            name: productDetails.name,
                            description: productDetails.description,
                        },
                        unit_amount: productDetails.amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // or 'subscription' if recurring
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}?payment=cancelled`,
            metadata: {
                userId: userId,
                packageType: packageType
            },
            customer_email: req.user.email,
        });

        console.log('✅ Stripe session created:', session.id);

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('❌ Error creating checkout session:', error);
        console.error('Error Stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
};

// Handle Stripe Webhook
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        // Verify the event came from Stripe
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // If no webhook secret is configured (e.g. dev without CLI), use body directly (LESS SECURE)
            // Only for strictly controlled dev environments. 
            event = req.body;
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification.');
        }
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutSessionCompleted(session);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
};

// Verify checkout session (Fallback for webhooks)
exports.verifyCheckoutSession = async (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        console.log(`🔍 Verifying session: ${sessionId}`);

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.payment_status === 'paid') {
            console.log(`✅ Session ${sessionId} is paid. Updating user...`);
            await handleCheckoutSessionCompleted(session);
            return res.json({ success: true, message: 'Payment verified and plan updated' });
        } else {
            console.log(`⚠️ Session ${sessionId} is NOT paid. Status: ${session.payment_status}`);
            return res.json({ success: false, message: 'Payment not completed', status: session.payment_status });
        }

    } catch (error) {
        console.error('❌ Error verifying session:', error);
        res.status(500).json({ error: error.message });
    }
};

const handleCheckoutSessionCompleted = async (session) => {
    const userId = session.metadata.userId;
    const packageType = session.metadata.packageType;

    console.log(`✅ Payment successful for user ${userId}, upgrading to ${packageType}`);

    try {
        let user = await User.findOne({ clerkId: userId });
        if (!user) {
            console.error(`User not found for ID: ${userId}`);
            return;
        }

        // Update user package
        // Duration: 30 days (example)
        user.package.type = packageType;
        // user.package.startDate = new Date(); // Don't reset start date if just verifying? Actually fine to reset.
        user.package.isActive = true;

        // Handle expiration
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (!user.package.endDate || user.package.endDate < new Date()) {
            user.package.startDate = new Date();
            user.package.endDate = new Date(Date.now() + thirtyDays);
        } else {
            // Extend existing
            user.package.endDate = new Date(user.package.endDate.getTime() + thirtyDays);
        }

        await user.save();
        console.log(`User ${user.email} successfully upgraded.`);

    } catch (err) {
        console.error('Error updating user after payment:', err);
    }
}
