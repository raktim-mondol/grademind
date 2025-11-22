const express = require('express');
const router = express.Router();
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
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
    const user = await User.findById(req.params.userId);

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
    const user = await User.findById(req.params.userId);

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
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current count based on action
    let currentCount = 0;
    const Assignment = require('../models/assignment');
    const Project = require('../models/project');

    switch (action) {
      case 'create_assignment':
        currentCount = await Assignment.countDocuments({ userId });
        break;
      case 'create_project':
        currentCount = await Project.countDocuments({ userId });
        break;
    }

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
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
