const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');

// Get all available packages with their limits
router.get('/plans', async (req, res) => {
  try {
    const plans = User.PACKAGE_LIMITS;
    res.json({ plans });
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's current package and usage
router.get('/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Try to use authenticated user if it matches
    if (req.user && (req.user.clerkId === userId || req.user._id.toString() === userId)) {
      const summary = req.user.getUsageSummary();
      return res.json(summary);
    }

    // 2. Try to find user by MongoDB ID
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    // 3. Try to find user by Clerk ID
    if (!user) {
      user = await User.findOne({ clerkId: userId });
    }

    if (!user) {
      // Return default starter response for users not in database
      console.log(`⚠️ User not found: ${userId} - returning default starter tier`);
      const limits = User.PACKAGE_LIMITS.starter || {};
      return res.json({
        package: 'starter',
        isActive: true,
        expiresAt: null,
        usage: {
          assignments: {
            used: 0,
            lifetimeUsed: 0,
            limit: limits.maxLifetimeAssignments || 3,
            remaining: limits.maxLifetimeAssignments || 3
          },
          submissions: {
            totalGraded: 0,
            lifetimeUsed: 0,
            limit: limits.maxLifetimeSubmissions || 50,
            remaining: limits.maxLifetimeSubmissions || 50
          },
        },
        features: limits.features || ['basic_grading'],
        lastActivity: null,
        isDevMode: true
      });
    }

    const summary = user.getUsageSummary();
    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's activity log
router.get('/activity/:userId', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.params.userId;

    let user = null;

    // Prefer the authenticated user if it matches
    if (req.user && (req.user.clerkId === userId || req.user._id.toString() === userId)) {
      user = req.user;
    } else {
      // Validation/Lookup
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

    const activities = user.activityLog
      .slice()
      .reverse()
      .slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      activities,
      total: user.activityLog.length
    });
  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user's package (admin only or via payment webhook)
router.put('/upgrade/:userId', async (req, res) => {
  try {
    const { packageType, duration = 30 } = req.body;
    const userId = req.params.userId;

    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ clerkId: userId });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!User.PACKAGE_LIMITS[packageType]) {
      return res.status(400).json({ error: 'Invalid package type' });
    }

    // Update package
    user.package.type = packageType;
    user.package.startDate = new Date();
    user.package.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    user.package.isActive = true;

    await user.save();

    console.log(`✅ User ${user.email} upgraded to ${packageType}`);

    res.json({
      message: 'Package upgraded successfully',
      package: user.package,
      limits: user.getPackageLimits()
    });
  } catch (error) {
    console.error('❌ Error upgrading package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel/downgrade to free
router.put('/cancel/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.package.type = 'free';
    user.package.endDate = null;
    user.package.autoRenew = false;

    await user.save();

    console.log(`📄 User ${user.email} downgraded to free`);

    res.json({
      message: 'Package cancelled, reverted to free tier',
      package: user.package
    });
  } catch (error) {
    console.error('❌ Error cancelling package:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user can perform specific action
router.get('/can-perform/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;

    // Validate ObjectId format for dev mode support
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`⚠️ Invalid ObjectId format: ${userId} - allowing action in dev mode`);
      return res.json({ allowed: true, isDevMode: true });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log(`⚠️ User not found: ${userId} - allowing action in dev mode`);
      return res.json({ allowed: true, isDevMode: true });
    }

    // Get current count based on action
    let currentCount = 0;
    const Assignment = require('../models/assignment');


    const result = user.canPerformAction(action, currentCount);
    res.json(result);
  } catch (error) {
    console.error('❌ Error checking action:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user has feature
router.get('/has-feature/:userId/:feature', async (req, res) => {
  try {
    const { userId, feature } = req.params;

    // Validate ObjectId format for dev mode support
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`⚠️ Invalid ObjectId format: ${userId} - granting feature in dev mode`);
      return res.json({ hasFeature: true, currentPackage: 'free', isDevMode: true });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log(`⚠️ User not found: ${userId} - granting feature in dev mode`);
      return res.json({ hasFeature: true, currentPackage: 'free', isDevMode: true });
    }

    res.json({
      hasFeature: user.hasFeature(feature),
      currentPackage: user.package.type
    });
  } catch (error) {
    console.error('❌ Error checking feature:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
