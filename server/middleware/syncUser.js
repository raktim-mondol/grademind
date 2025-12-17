const User = require('../models/user');
const { clerkClient } = require('@clerk/clerk-sdk-node');

/**
 * Middleware to sync Clerk user with MongoDB user
 * This should run after Clerk authentication middleware (which populates req.auth)
 */
const syncUser = async (req, res, next) => {
    try {
        // 1. Check if we have Clerk auth data
        if (!req.auth || !req.auth.userId) {
            // If no auth, we can't sync. Proceed.
            // Downstream routes that require auth will fail anyway if they check req.user
            return next();
        }

        const clerkId = req.auth.userId;

        // 2. Try to find user by clerkId
        let user = await User.findOne({ clerkId });

        // 3. If not found, check if we can find by email (legacy user migration)
        if (!user) {
            try {
                // Fetch user details from Clerk to get email
                const clerkUser = await clerkClient.users.getUser(clerkId);
                const email = clerkUser.emailAddresses[0]?.emailAddress;

                if (email) {
                    user = await User.findOne({ email });

                    if (user) {
                        // Link legacy user to Clerk ID
                        user.clerkId = clerkId;
                        await user.save();
                        console.log(`🔗 Linked legacy user ${email} to Clerk ID ${clerkId}`);
                    } else {
                        // Create new user
                        user = new User({
                            clerkId,
                            email,
                            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User',
                            password: 'clerk_managed', // Dummy password as we use Clerk
                            role: 'instructor'
                        });
                        await user.save();
                        console.log(`✨ Created new user for Clerk ID ${clerkId}`);
                    }
                }
            } catch (clerkError) {
                console.error('Error fetching user from Clerk:', clerkError);
            }
        }

        // 4. Attach Mongoose user document to request
        // This allows downstream middleware (like packageUsage) to work seamlessly
        if (user) {
            // Auto-migrate legacy 'free' users to 'starter'
            // Ensure package object exists
            if (user.package && user.package.type === 'free') {
                user.package.type = 'starter';
                await user.save();
                console.log(`✨ Migrated user ${user.email} from Free to Starter`);
            }

            req.user = user;
            req.user.id = user._id; // Ensure id alias is available
        }

        next();
    } catch (error) {
        console.error('❌ User Sync Error:', error);
        // Don't block request, but log error
        next();
    }
};

module.exports = syncUser;
