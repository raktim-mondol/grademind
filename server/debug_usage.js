const mongoose = require('mongoose');
const User = require('./models/user');
const path = require('path');
console.log('__dirname:', __dirname);
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '.env') });
if (dotenvResult.error) {
    console.log('Dotenv error:', dotenvResult.error);
    // Try default load
    require('dotenv').config();
}

async function testUsageIncrement() {
    try {
        console.log('Loading .env...');
        // Connect to DB
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
        console.log('Using URI:', mongoURI.substring(0, 15) + '...');

        console.log('Connecting to mongoose...');
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Find a test user or create one
        // We'll look for the first user
        const user = await User.findOne();
        if (!user) {
            console.log('No user found to test with.');
            return;
        }

        console.log(`Testing with user: ${user.email} (${user._id})`);
        console.log('Initial Usage:', JSON.stringify(user.usage, null, 2));

        const initialCount = user.usage.lifetimeSubmissionsChecked || 0;
        const initialActive = user.usage.totalSubmissionsGraded || 0;

        // Simulate increment
        console.log('Incrementing totalSubmissionsGraded...');
        await user.incrementUsage('totalSubmissionsGraded');

        // Re-fetch user to confirm persistence
        const updatedUser = await User.findById(user._id);
        console.log('Updated Usage:', JSON.stringify(updatedUser.usage, null, 2));

        const newCount = updatedUser.usage.lifetimeSubmissionsChecked || 0;
        const newActive = updatedUser.usage.totalSubmissionsGraded || 0;

        if (newCount === initialCount + 1 && newActive === initialActive + 1) {
            console.log('SUCCESS: Usage incremented correctly.');
        } else {
            console.log('FAILURE: Usage did not increment correctly.');
            console.log(`Expected: Lifetime ${initialCount + 1}, Active ${initialActive + 1}`);
            console.log(`Got: Lifetime ${newCount}, Active ${newActive}`);
        }

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testUsageIncrement();
