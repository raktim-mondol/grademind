const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config(); // Load env vars

// Hardcoded connection string if .env is missing or issue resolving
// Assuming local mongodb for dev environment based on "local.test" naming
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';

const seedUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = [
            {
                email: 'dev@local.test',
                name: 'Demo Admin (Free)',
                password: 'password123', // In a real app, hash this!
                role: 'admin',
                package: {
                    type: 'free',
                    isActive: true,
                    startDate: new Date()
                }
            },
            {
                email: 'pro@local.test',
                name: 'Demo Admin (Pro)',
                password: 'password123', // In a real app, hash this!
                role: 'admin',
                package: {
                    type: 'pro',
                    isActive: true,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
                }
            }
        ];

        for (const userData of users) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.email} already exists. Updating...`);
                existingUser.package = userData.package;
                existingUser.role = userData.role;
                // Don't overwrite other fields like usage to preserve history
                await existingUser.save();
                console.log(`Updated ${userData.email}`);
            } else {
                console.log(`Creating user ${userData.email}...`);
                const newUser = new User(userData);
                await newUser.save();
                console.log(`Created ${userData.email}`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedUsers();
