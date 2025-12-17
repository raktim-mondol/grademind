const User = require('../models/user');
const Assignment = require('../models/assignment');


/**
 * Middleware to check if user can create an assignment
 */
const checkAssignmentLimit = async (req, res, next) => {
  try {
    let userId = req.user?.clerkId || req.user?.id || req.body.userId; // Use Clerk ID from req.user if available

    // If we have a req.user from syncUser, use its ID directly
    if (req.user && !userId) userId = req.user.clerkId;

    let user = null;

    if (!userId) {
      // If no user context, allow (for backward compatibility)
      return next();
    }

    // 1. Prefer authenticated user (from syncUser)
    if (req.user && (req.user.clerkId === userId || req.user._id.toString() === userId)) {
      user = req.user;
    } else {
      // 2. Lookup by Mongo ID
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      // 3. Lookup by Clerk ID
      if (!user) {
        user = await User.findOne({ clerkId: userId });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentCount = user.usage.lifetimeAssignmentsCreated || 0;
    const check = user.canPerformAction('create_assignment', currentCount);

    if (!check.allowed) {
      return res.status(403).json({
        error: check.reason,
        limit: check.limit,
        current: check.current,
        upgradeRequired: true
      });
    }

    req.packageUser = user;
    next();
  } catch (error) {
    console.error('❌ Error checking assignment limit:', error);
    res.status(500).json({ error: 'Failed to check package limits' });
  }
};

/**
 * Middleware to check if user can submit to an assignment
 */
const checkSubmissionLimit = async (req, res, next) => {
  try {
    const assignmentId = req.params.assignmentId || req.body.assignmentId;
    let userId = req.user?.clerkId || req.user?.id || req.body.userId;
    let user = null;

    if (!userId || !assignmentId) {
      return next();
    }

    // 1. Prefer authenticated user
    if (req.user && (req.user.clerkId === userId || req.user._id.toString() === userId)) {
      user = req.user;
    } else {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      if (!user) {
        user = await User.findOne({ clerkId: userId });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentCount = user.usage.lifetimeSubmissionsChecked || 0;
    const check = user.canPerformAction('grade_submission', currentCount);

    if (!check.allowed) {
      return res.status(403).json({
        error: check.reason,
        limit: check.limit,
        current: check.current,
        upgradeRequired: true
      });
    }

    req.packageUser = user;
    next();
  } catch (error) {
    console.error('❌ Error checking submission limit:', error);
    res.status(500).json({ error: 'Failed to check package limits' });
  }
};



/**
 * Middleware to check if user has access to a feature
 */
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return next();
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.hasFeature(feature)) {
        return res.status(403).json({
          error: `The '${feature}' feature is not available in your current package`,
          currentPackage: user.package.type,
          upgradeRequired: true
        });
      }

      req.packageUser = user;
      next();
    } catch (error) {
      console.error('❌ Error checking feature access:', error);
      res.status(500).json({ error: 'Failed to check feature access' });
    }
  };
};

/**
 * Middleware to track activity after successful operation
 */
const trackActivity = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to track after success
    res.json = async function (data) {
      // Only track on success
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || req.body.userId;
          if (userId) {
            let user = req.user;

            if (!user || user.id !== userId) {
              if (mongoose.Types.ObjectId.isValid(userId)) {
                user = await User.findById(userId);
              }
              if (!user) {
                user = await User.findOne({ clerkId: userId });
              }
            }

            if (user) {
              const resourceId = data._id || data.id || data.assignment?._id || data.submission?._id;
              await user.logActivity(action, resourceId, resourceType, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
              });

              // Update usage counters
              switch (action) {
                case 'assignment_created':
                  await user.incrementUsage('assignmentsCreated');
                  break;
                case 'submission_graded':
                  await user.incrementUsage('totalSubmissionsGraded');
                  break;
              }
            }
          }
        } catch (error) {
          console.error('❌ Error tracking activity:', error);
        }
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware to decrement usage on delete
 */
const trackDeletion = (usageField) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.user?.id || req.body.userId;
          if (userId) {
            const user = await User.findById(userId);
            if (user) {
              await user.decrementUsage(usageField);
            }
          }
        } catch (error) {
          console.error('❌ Error tracking deletion:', error);
        }
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  checkAssignmentLimit,
  checkSubmissionLimit,
  checkFeatureAccess,
  trackActivity,
  trackDeletion
};
