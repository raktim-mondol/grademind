const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Package definitions with limits
const PACKAGE_LIMITS = {
  free: {
    maxAssignments: 3,
    maxSubmissionsPerAssignment: 10,
    maxProjects: 1,
    maxProjectSubmissions: 5,
    features: ['basic_grading']
  },
  basic: {
    maxAssignments: 10,
    maxSubmissionsPerAssignment: 50,
    maxProjects: 5,
    maxProjectSubmissions: 25,
    features: ['basic_grading', 'excel_export']
  },
  pro: {
    maxAssignments: 50,
    maxSubmissionsPerAssignment: 200,
    maxProjects: 25,
    maxProjectSubmissions: 100,
    features: ['basic_grading', 'excel_export', 'orchestration', 'priority_processing']
  },
  enterprise: {
    maxAssignments: -1, // unlimited
    maxSubmissionsPerAssignment: -1,
    maxProjects: -1,
    maxProjectSubmissions: -1,
    features: ['basic_grading', 'excel_export', 'orchestration', 'priority_processing', 'api_access', 'custom_branding']
  }
};

const UsageSchema = new Schema({
  assignmentsCreated: {
    type: Number,
    default: 0
  },
  totalSubmissionsGraded: {
    type: Number,
    default: 0
  },
  projectsCreated: {
    type: Number,
    default: 0
  },
  projectSubmissionsGraded: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ActivityLogSchema = new Schema({
  action: {
    type: String,
    required: true,
    enum: ['assignment_created', 'assignment_deleted', 'submission_graded', 'project_created', 'project_deleted', 'project_submission_graded', 'excel_exported', 'orchestration_run']
  },
  resourceId: {
    type: Schema.Types.ObjectId
  },
  resourceType: {
    type: String,
    enum: ['assignment', 'submission', 'project', 'project_submission']
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
    required: true,
    unique: true
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
      enum: ['free', 'basic', 'pro', 'enterprise'],
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

// Method to get package limits
UserSchema.methods.getPackageLimits = function() {
  return PACKAGE_LIMITS[this.package.type] || PACKAGE_LIMITS.free;
};

// Method to check if user can perform action
UserSchema.methods.canPerformAction = function(action, currentCount = 0) {
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
      if (limits.maxAssignments === -1) return { allowed: true };
      if (currentCount >= limits.maxAssignments) {
        return {
          allowed: false,
          reason: `Assignment limit reached (${limits.maxAssignments}). Upgrade your package for more.`,
          limit: limits.maxAssignments,
          current: currentCount
        };
      }
      return { allowed: true };

    case 'grade_submission':
      if (limits.maxSubmissionsPerAssignment === -1) return { allowed: true };
      if (currentCount >= limits.maxSubmissionsPerAssignment) {
        return {
          allowed: false,
          reason: `Submission limit per assignment reached (${limits.maxSubmissionsPerAssignment}). Upgrade your package for more.`,
          limit: limits.maxSubmissionsPerAssignment,
          current: currentCount
        };
      }
      return { allowed: true };

    case 'create_project':
      if (limits.maxProjects === -1) return { allowed: true };
      if (currentCount >= limits.maxProjects) {
        return {
          allowed: false,
          reason: `Project limit reached (${limits.maxProjects}). Upgrade your package for more.`,
          limit: limits.maxProjects,
          current: currentCount
        };
      }
      return { allowed: true };

    case 'grade_project_submission':
      if (limits.maxProjectSubmissions === -1) return { allowed: true };
      if (currentCount >= limits.maxProjectSubmissions) {
        return {
          allowed: false,
          reason: `Project submission limit reached (${limits.maxProjectSubmissions}). Upgrade your package for more.`,
          limit: limits.maxProjectSubmissions,
          current: currentCount
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
};

// Method to check if feature is available
UserSchema.methods.hasFeature = function(feature) {
  const limits = this.getPackageLimits();
  return limits.features.includes(feature);
};

// Method to log activity
UserSchema.methods.logActivity = async function(action, resourceId, resourceType, details = {}) {
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
UserSchema.methods.incrementUsage = async function(field) {
  if (this.usage[field] !== undefined) {
    this.usage[field] += 1;
    this.usage.lastActivityDate = new Date();
    await this.save();
  }
};

// Method to decrement usage counter
UserSchema.methods.decrementUsage = async function(field) {
  if (this.usage[field] !== undefined && this.usage[field] > 0) {
    this.usage[field] -= 1;
    await this.save();
  }
};

// Method to get usage summary
UserSchema.methods.getUsageSummary = function() {
  const limits = this.getPackageLimits();

  return {
    package: this.package.type,
    isActive: this.package.isActive,
    expiresAt: this.package.endDate,
    usage: {
      assignments: {
        used: this.usage.assignmentsCreated,
        limit: limits.maxAssignments,
        remaining: limits.maxAssignments === -1 ? 'unlimited' : Math.max(0, limits.maxAssignments - this.usage.assignmentsCreated)
      },
      projects: {
        used: this.usage.projectsCreated,
        limit: limits.maxProjects,
        remaining: limits.maxProjects === -1 ? 'unlimited' : Math.max(0, limits.maxProjects - this.usage.projectsCreated)
      },
      totalSubmissionsGraded: this.usage.totalSubmissionsGraded,
      totalProjectSubmissionsGraded: this.usage.projectSubmissionsGraded
    },
    features: limits.features,
    lastActivity: this.usage.lastActivityDate
  };
};

// Static method to get package limits
UserSchema.statics.getPackageLimits = function(packageType) {
  return PACKAGE_LIMITS[packageType] || PACKAGE_LIMITS.free;
};

// Export package limits for use elsewhere
UserSchema.statics.PACKAGE_LIMITS = PACKAGE_LIMITS;

module.exports = mongoose.model('User', UserSchema);
