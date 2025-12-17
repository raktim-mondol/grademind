const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Package definitions with limits
// Package definitions with limits
const PACKAGE_LIMITS = {
  starter: {
    maxAssignments: 1,
    maxLifetimeAssignments: 1,
    maxSubmissionsPerAssignment: 10,
    maxLifetimeSubmissions: 10,
    features: ['basic_grading']
  },
  free: {
    maxAssignments: 1,
    maxLifetimeAssignments: 1,
    maxSubmissionsPerAssignment: 20,
    maxLifetimeSubmissions: 20,
    features: ['basic_grading']
  },
  basic: { // Kept for legacy/intermediate, assuming slightly better than free? Or deprecated? Leaving as is but adding lifetime placeholders.
    maxAssignments: 10,
    maxLifetimeAssignments: 10,
    maxSubmissionsPerAssignment: 50,
    maxLifetimeSubmissions: 100,
    features: ['basic_grading', 'excel_export']
  },
  pro: {
    maxAssignments: 3,
    maxLifetimeAssignments: 3,
    maxSubmissionsPerAssignment: 100,
    maxLifetimeSubmissions: 100,
    features: ['basic_grading', 'excel_export', 'orchestration', 'priority_processing']
  },
  enterprise: {
    maxAssignments: -1,
    maxLifetimeAssignments: -1,
    maxSubmissionsPerAssignment: -1,
    maxLifetimeSubmissions: -1,
    features: ['basic_grading', 'excel_export', 'orchestration', 'priority_processing', 'api_access', 'custom_branding']
  }
};

const UsageSchema = new Schema({
  assignmentsCreated: { type: Number, default: 0 },
  lifetimeAssignmentsCreated: { type: Number, default: 0 }, // NEW: Track total created ever

  totalSubmissionsGraded: { type: Number, default: 0 },
  lifetimeSubmissionsChecked: { type: Number, default: 0 },


  lastActivityDate: { type: Date, default: Date.now }
}, { _id: false });

const ActivityLogSchema = new Schema({
  action: {
    type: String,
    required: true,
    enum: ['assignment_created', 'assignment_deleted', 'submission_graded', 'excel_exported', 'orchestration_run']
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  resourceType: {
    type: String,
    enum: ['assignment', 'submission']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: Schema.Types.Mixed
  }
}, { _id: false });

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    type: String,
    required: true,
    unique: true
  },
  clerkId: {
    type: String,
    unique: true,
    sparse: true // Allow null/undefined for legacy users initially
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['instructor', 'admin'],
    default: 'instructor'
  },

  // Package information
  package: {
    type: {
      type: String,
      enum: ['free', 'starter', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },

  // Usage tracking
  usage: {
    type: UsageSchema,
    default: () => ({})
  },

  // Activity history (last 100 activities)
  activityLog: {
    type: [ActivityLogSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.methods.getPackageLimits = function () {
  return PACKAGE_LIMITS[this.package.type] || PACKAGE_LIMITS.starter;
};

// Method to check if user can perform action
UserSchema.methods.canPerformAction = function (action, currentCount = 0) {
  const limits = this.getPackageLimits();

  // Check if package is active
  if (!this.package.isActive) {
    return { allowed: false, reason: 'Package subscription is not active' };
  }

  // Check expiration
  if (this.package.endDate && new Date() > this.package.endDate) {
    return { allowed: false, reason: 'Package subscription has expired' };
  }

  switch (action) {
    case 'create_assignment':
      if (limits.maxLifetimeAssignments === -1) return { allowed: true };

      // Check Lifetime limit
      if (this.usage.lifetimeAssignmentsCreated >= limits.maxLifetimeAssignments) {
        return {
          allowed: false,
          reason: `Lifetime assignment limit reached (${limits.maxLifetimeAssignments}). This limit persists even if you delete assignments. Upgrade package for more.`,
          limit: limits.maxLifetimeAssignments,
          current: this.usage.lifetimeAssignmentsCreated
        };
      }
      return { allowed: true };

    case 'grade_submission':
    case 'grade_project_submission':
      // Unified submission checking limit
      if (limits.maxLifetimeSubmissions === -1) return { allowed: true };

      if (this.usage.lifetimeSubmissionsChecked >= limits.maxLifetimeSubmissions) {
        return {
          allowed: false,
          reason: `Lifetime student submission checking limit reached (${limits.maxLifetimeSubmissions}). This limit includes all assignments and projects and persists even if deleted. Upgrade package to increase limit.`,
          limit: limits.maxLifetimeSubmissions,
          current: this.usage.lifetimeSubmissionsChecked
        };
      }

      return { allowed: true };



    default:
      return { allowed: true };
  }
};

// Method to check if feature is available
UserSchema.methods.hasFeature = function (feature) {
  const limits = this.getPackageLimits();
  return limits.features.includes(feature);
};

// Method to log activity
UserSchema.methods.logActivity = async function (action, resourceId, resourceType, details = {}) {
  const activity = {
    action,
    resourceId,
    resourceType,
    timestamp: new Date(),
    details
  };

  // Keep only last 100 activities
  if (this.activityLog.length >= 100) {
    this.activityLog.shift();
  }

  this.activityLog.push(activity);
  this.usage.lastActivityDate = new Date();

  await this.save();
};

// Method to increment usage counter
UserSchema.methods.incrementUsage = async function (field) {
  console.log(`[User Model] incrementUsage called for field: ${field}, Current value: ${this.usage[field]}`);
  if (this.usage[field] !== undefined) {
    this.usage[field] += 1; // Increment active count
    console.log(`[User Model] Incremented active count to: ${this.usage[field]}`);

    // Also increment lifetime counters
    if (field === 'assignmentsCreated') {
      this.usage.lifetimeAssignmentsCreated = (this.usage.lifetimeAssignmentsCreated || 0) + 1;
      console.log(`[User Model] Incremented lifetimeAssignmentsCreated to: ${this.usage.lifetimeAssignmentsCreated}`);

    } else if (field === 'totalSubmissionsGraded') {
      // Both contribute to the single lifetime submissions counter
      this.usage.lifetimeSubmissionsChecked = (this.usage.lifetimeSubmissionsChecked || 0) + 1;
      console.log(`[User Model] Incremented lifetimeSubmissionsChecked to: ${this.usage.lifetimeSubmissionsChecked}`);
    }

    this.usage.lastActivityDate = new Date();
    const saveResult = await this.save();
    console.log(`[User Model] User saved. New version: ${saveResult.__v}`);
  } else {
    console.error(`[User Model] Field ${field} is undefined in usage schema`);
  }
};

// Method to decrement usage counter
UserSchema.methods.decrementUsage = async function (field) {
  // Only decrement ACTIVE usage, never lifetime usage
  if (this.usage[field] !== undefined && this.usage[field] > 0) {
    this.usage[field] -= 1;
    await this.save();
  }
};

// Method to get usage summary
UserSchema.methods.getUsageSummary = function () {
  const limits = this.getPackageLimits();

  return {
    package: this.package.type,
    isActive: this.package.isActive,
    expiresAt: this.package.endDate,
    usage: {
      assignments: {
        used: this.usage.assignmentsCreated, // Active count (for info)
        lifetimeUsed: this.usage.lifetimeAssignmentsCreated || 0, // NEW: Lifetime count
        limit: limits.maxLifetimeAssignments, // Display lifetime limit
        remaining: limits.maxLifetimeAssignments === -1 ? 'unlimited' : Math.max(0, limits.maxLifetimeAssignments - (this.usage.lifetimeAssignmentsCreated || 0))
      },
      submissions: {
        totalGraded: this.usage.totalSubmissionsGraded,
        lifetimeUsed: this.usage.lifetimeSubmissionsChecked || 0,
        limit: limits.maxLifetimeSubmissions,
        remaining: limits.maxLifetimeSubmissions === -1 ? 'unlimited' : Math.max(0, limits.maxLifetimeSubmissions - (this.usage.lifetimeSubmissionsChecked || 0))
      }
    },
    features: limits.features,
    lastActivity: this.usage.lastActivityDate
  };
};

// Static method to get package limits
UserSchema.statics.getPackageLimits = function (packageType) {
  return PACKAGE_LIMITS[packageType] || PACKAGE_LIMITS.starter;
};

// Export package limits for use elsewhere
UserSchema.statics.PACKAGE_LIMITS = PACKAGE_LIMITS;

module.exports = mongoose.model('User', UserSchema);
