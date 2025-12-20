const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/user');

const log = (msg) => {
    console.log(msg);
    try {
        fs.appendFileSync('status.txt', msg + '\n');
    } catch (e) {
        // ignore
    }
};

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
        log(`Unmasked URI (debugging): ${mongoURI}`); // Temporarily log to see if it's correct
        log(`Connecting to MongoDB...`);

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000
        });
        log(`MongoDB Connected`);
    } catch (error) {
        log(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

const resetUsage = async () => {
    await connectDB();

    const email = 'raktim.live@gmail.com';

    try {
        log(`Looking for user with email: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            log(`User with email ${email} not found.`);
            process.exit(1);
        }

        log(`User found: ${user.name} (${user.email})`);
        log('Current Usage: ' + JSON.stringify(user.usage, null, 2));

        // Reset usage
        // Resetting active assignment count
        user.usage.assignmentsCreated = 0;
        // Resetting lifetime assignment count (the one causing 3/3 error)
        user.usage.lifetimeAssignmentsCreated = 0;

        // Resetting submission counts
        user.usage.totalSubmissionsGraded = 0;
        user.usage.lifetimeSubmissionsChecked = 0;

        user.usage.lastActivityDate = new Date();

        // Mark as modified just in case
        user.markModified('usage');

        await user.save();

        log('Usage reset successfully.');
        log('New Usage: ' + JSON.stringify(user.usage, null, 2));

    } catch (error) {
        log(`Error resetting usage: ${error.message}`);
    } finally {
        await mongoose.connection.close();
        log('Database connection closed.');
        process.exit(0);
    }
};

resetUsage();
