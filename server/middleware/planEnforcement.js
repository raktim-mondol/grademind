const User = require('../models/user');
const Assignment = require('../models/assignment');


/**
 * Middleware to enforce plan limits
 * Checks if the authenticated user can perform the requested action based on their plan
 */
const enforcePlanLimits = (action) => {
    return async (req, res, next) => {
        try {
            // Get user ID from authenticated user (set by auth middleware)
            const userId = req.user?._id || req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Fetch user
            const mongoose = require('mongoose');

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.log(`⚠️ Dev mode: Invalid ObjectId format - skipping plan enforcement`);
                return next();
            }

            const user = await User.findById(userId);
            if (!user) {
                // Dev mode: Allow if user doesn't exist in database
                console.log(`⚠️ Dev mode: User not found - skipping plan enforcement`);
                return next();
            }

            let currentCount = 0;
            let actionName = '';

            // Get current count based on action (LIFETIME COUNTS)
            switch (action) {
                case 'create_assignment':
                    // Use lifetime count from user object directly
                    currentCount = user.usage.lifetimeAssignmentsCreated || 0;
                    actionName = 'create_assignment';
                    break;

                case 'grade_submission':
                    // Use lifetime count from user object directly (unified for all submissions)
                    currentCount = user.usage.lifetimeSubmissionsChecked || 0;
                    // Use 'grade_submission' as the unified action name in User model logic
                    // This line was intended to be removed or modified, but the provided snippet was syntactically incorrect.
                    // Assuming the intent was to remove project-related logic, and this line was part of a larger,
                    // incorrect edit, we will keep the original correct line for 'actionName' and remove other project logic.
                    actionName = 'grade_submission';
                    break;

                default:
                    // Unknown action, allow by default
                    return next();
            }

            // Check if user can perform action
            const result = user.canPerformAction(actionName, currentCount);

            if (!result.allowed) {
                return res.status(403).json({
                    error: 'Plan limit reached',
                    message: result.reason,
                    limit: result.limit,
                    current: result.current,
                    package: user.package.type,
                    upgradeRequired: true
                });
            }

            // Allow request to proceed
            next();

        } catch (error) {
            console.error('❌ Error in plan enforcement middleware:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to check if user has a specific feature
 */
const requireFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?._id || req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const mongoose = require('mongoose');

            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.log(`⚠️ Dev mode: Invalid ObjectId - granting feature access`);
                return next();
            }

            const user = await User.findById(userId);
            if (!user) {
                // Dev mode: Allow if user doesn't exist in database
                console.log(`⚠️ Dev mode: User not found - granting feature access`);
                return next();
            }

            if (!user.hasFeature(featureName)) {
                return res.status(403).json({
                    error: 'Feature not available',
                    message: `This feature is not available in your ${user.package.type} plan`,
                    feature: featureName,
                    package: user.package.type,
                    upgradeRequired: true
                });
            }

            next();

        } catch (error) {
            console.error('❌ Error in feature check middleware:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to log activity for tracking
 */
const logActivity = (action, resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?._id || req.user?.id;

            if (!userId) {
                return next();
            }

            const user = await User.findById(userId);
            if (!user) {
                return next();
            }

            // Store original end function
            const originalEnd = res.end;

            // Override res.end to log activity after successful response
            res.end = async function (...args) {
                // Only log on successful responses (2xx status codes)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        let resourceId = null;
                        let details = {};

                        // Try to extract resource ID from response or request
                        if (res.locals?.createdResource?._id) {
                            resourceId = res.locals.createdResource._id;
                        } else if (req.params?.id) {
                            resourceId = req.params.id;
                        }

                        // Extract relevant details
                        if (resourceType === 'assignment' && res.locals?.createdResource) {
                            details.title = res.locals.createdResource.title;
                        } else if (resourceType === 'project' && res.locals?.createdResource) {
                            details.title = res.locals.createdResource.title;
                        }

                        // Log activity asynchronously (don't wait)
                        user.logActivity(action, resourceId, resourceType, details).catch(err => {
                            console.error('Error logging activity:', err);
                        });

                        // Increment logic removed - handled explicitly in controllers to prevent race conditions
                        // and ensure reliable counting only on successful processing initiation.

                        /*
                        // Increment usage counter for creates
                        if (action === 'assignment_created') {
                            user.incrementUsage('assignmentsCreated').catch(err => {
                                console.error('Error incrementing usage:', err);
                            });
                        } else if (action === 'submission_graded') {
                            user.incrementUsage('totalSubmissionsGraded').catch(err => {
                                console.error('Error incrementing usage:', err);
                            });
                        }
                        */

                    } catch (error) {
                        console.error('Error in activity logging:', error);
                    }
                }

                // Call original end
                originalEnd.apply(res, args);
            };

            next();

        } catch (error) {
            console.error('❌ Error setting up activity logging:', error);
            next();
        }
    };
};

module.exports = {
    enforcePlanLimits,
    requireFeature,
    logActivity
};
