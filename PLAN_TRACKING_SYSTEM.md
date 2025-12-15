# Plan-Based Tracking System

## Overview

The EduGrade platform now includes a comprehensive plan-based tracking system that enforces usage limits based on user subscription tiers. This ensures users can only access features and create resources according to their current plan.

## Available Plans

### 🆓 Free Plan
- **Cost**: $0/month
- **Limits**:
  - 3 Assignments
  - 10 Submissions per Assignment
  - 1 Project
  - 5 Project Submissions
- **Features**:
  - Basic grading functionality

### 📘 Basic Plan
- **Cost**: $9/month
- **Limits**:
  - 10 Assignments
  - 50 Submissions per Assignment
  - 5 Projects
  - 25 Project Submissions
- **Features**:
  - Basic grading
  - Excel export

### ⚡ Pro Plan (Most Popular)
- **Cost**: $29/month
- **Limits**:
  - 50 Assignments
  - 200 Submissions per Assignment
  - 25 Projects
  - 100 Project Submissions
- **Features**:
  - Basic grading
  - Excel export
  - Orchestration
  - Priority processing

### 🏢 Enterprise Plan
- **Cost**: Custom pricing
- **Limits**:
  - Unlimited everything
- **Features**:
  - All features
  - API access
  - Custom branding
  - Dedicated support

## Technical Implementation

### Backend Components

#### 1. User Model (`server/models/user.js`)

The user model includes:
- **Package Information**: Current plan, start/end dates, active status
- **Usage Tracking**: Counters for assignments, projects, submissions created
- **Activity Log**: Last 100 activities for audit trail
- **Methods**:
  - `canPerformAction(action, currentCount)` - Check if user can perform action
  - `hasFeature(feature)` - Check if feature is available in plan
  - `logActivity(...)` - Log user activity
  - `incrementUsage(field)` - Increment usage counter
  - `getUsageSummary()` - Get current usage vs limits

#### 2. Plan Enforcement Middleware (`server/middleware/planEnforcement.js`)

Three middleware functions:
- **`enforcePlanLimits(action)`** - Prevents actions that exceed plan limits
- **`requireFeature(featureName)`** - Blocks access to unavailable features
- **`logActivity(action, resourceType)`** - Logs all plan-related activities

#### 3. Package Routes (`server/routes/packages.js`)

API endpoints:
- `GET /api/packages/plans` - Get all available plans
- `GET /api/packages/usage/:userId` - Get user's current usage
- `GET /api/packages/activity/:userId` - Get user's activity log
- `PUT /api/packages/upgrade/:userId` - Upgrade user's plan
- `PUT /api/packages/cancel/:userId` - Downgrade to free tier
- `GET /api/packages/can-perform/:userId/:action` - Check if action allowed
- `GET /api/packages/has-feature/:userId/:feature` - Check feature availability

#### 4. Protected Routes

Plan enforcement is applied to:
- **Assignment Creation**: `POST /api/assignments`
- **Project Creation**: `POST /api/projects`
- **Submission Processing**: Applied at controller level

### Frontend Components

#### 1. PlanUsageBanner (`client/src/components/ui/PlanUsageBanner.js`)

Beautiful widget displaying:
- Current plan with badge
- Usage progress bars for assignments and projects
- Warning indicators when approaching limits
- Total submissions graded stats
- Available features list
- Upgrade button

#### 2. PlanLimitModal (`client/src/components/ui/PlanLimitModal.js`)

Modal that appears when users hit limits showing:
- Clear error message
- Current usage statistics
- Benefits of upgrading
- Direct upgrade path
- Pricing information

#### 3. PlanManagement (`client/src/components/ui/PlanManagement.js`)

Full-page plan management interface with:
- Current plan overview with usage stats
- All available plans with pricing
- Feature comparison
- Detailed comparison table
- One-click upgrade functionality

#### 4. Integrated into Workspaces

The Workspaces page now includes:
- Plan usage banner at the top
- Error handling for plan limit violations
- Plan management mode
- Seamless upgrade flow

## Usage Flow

### 1. Creating an Assignment

```javascript
// User tries to create assignment
POST /api/assignments
→ auth middleware authenticates user
→ enforcePlanLimits('create_assignment') checks current count
→ If within limit: proceeds
→ If exceeded: returns 403 with upgrade info
```

### 2. Frontend Error Handling

```javascript
try {
  await api.post('/assignments', data);
} catch (error) {
  if (error.response?.data?.upgradeRequired) {
    // Show plan limit modal
    showUpgradePrompt(error.response.data);
  }
}
```

### 3. Viewing Usage

Users can view their plan usage:
- In the sidebar banner (always visible)
- In the full plan management page
- Via the API for programmatic access

## Activity Tracking

All plan-related activities are logged:
- Assignment created/deleted
- Project created/deleted
- Submission graded
- Project submission graded
- Excel exported
- Orchestration run

Activities include:
- Timestamp
- Action type
- Resource ID and type
- Additional details

## Enforcement Points

### Backend Enforcement
- **API Routes**: Middleware prevents unauthorized requests
- **Controllers**: Double-check limits before database operations
- **Models**: Track usage automatically on create/delete

### Frontend Enforcement
- **Proactive Display**: Show limits before users hit them
- **Graceful Degradation**: Disable buttons when limits reached
- **Clear Messaging**: Explain why actions are blocked

## Database Schema

### User Document
```javascript
{
  package: {
    type: 'free' | 'basic' | 'pro' | 'enterprise',
    startDate: Date,
    endDate: Date,
    isActive: Boolean,
    autoRenew: Boolean
  },
  usage: {
    assignmentsCreated: Number,
    totalSubmissionsGraded: Number,
    projectsCreated: Number,
    projectSubmissionsGraded: Number,
    lastActivityDate: Date
  },
  activityLog: [{
    action: String,
    resourceId: ObjectId,
    resourceType: String,
    timestamp: Date,
    details: Mixed
  }]
}
```

## Testing Plan Limits

### Manually Testing Limits

1. **Test Free Plan Limits**:
   ```bash
   # Create 3 assignments (should succeed)
   # Try to create 4th assignment (should fail)
   # Verify error message and upgrade prompt
   ```

2. **Test Upgrade Flow**:
   ```bash
   # Start on free plan
   # Hit assignment limit
   # Click upgrade in modal
   # Select basic plan
   # Verify limit increased
   # Create 4th assignment (should succeed)
   ```

3. **Test Usage Tracking**:
   ```bash
   # Create assignment → verify usage increments
   # Delete assignment → verify usage decrements
   # Check activity log → verify logged
   ```

### API Testing

```bash
# Get current usage
curl -X GET http://localhost:5001/api/packages/usage/:userId \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check if can perform action
curl -X GET http://localhost:5001/api/packages/can-perform/:userId/create_assignment \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upgrade plan
curl -X PUT http://localhost:5001/api/packages/upgrade/:userId \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageType": "basic", "duration": 30}'
```

## Future Enhancements

### Planned Features
1. **Payment Integration**: Stripe/PayPal integration for automatic billing
2. **Usage Analytics**: Detailed charts and trends
3. **Email Notifications**: Alert users before limits reached
4. **Team Plans**: Multi-user subscriptions
5. **Custom Plan Builder**: Let institutions create custom plans
6. **Usage Forecasting**: Predict when users will hit limits
7. **Auto-upgrade**: Automatically upgrade when hitting limits
8. **Trial Periods**: Time-limited full access

### Technical Improvements
1. **Caching**: Cache plan limits to reduce database queries
2. **Real-time Updates**: WebSocket-based usage updates
3. **Audit Trail**: Enhanced activity logging with IP tracking
4. **Rate Limiting**: Prevent abuse of API endpoints
5. **Quota Management**: Separate quotas for different resources

## Security Considerations

1. **Server-Side Enforcement**: All limits enforced on backend
2. **Token Validation**: Clerk authentication required for all plan endpoints
3. **Input Validation**: Validate plan types and durations
4. **Audit Logging**: Track all plan changes and upgrades
5. **Data Privacy**: Usage data only accessible to user

## Monitoring

### Key Metrics to Track
- Plan distribution (% users on each plan)
- Conversion rate (free → paid)
- Churn rate
- Average usage per plan
- Limit hit frequency
- Upgrade triggers

### Logs to Monitor
- Plan limit violations
- Usage spikes
- Failed upgrade attempts
- Suspicious activity patterns

## Support & Documentation

For users:
- Plan comparison page at `/plans`
- In-app tooltips explaining limits
- Help documentation on plan features
- Email support for plan questions

For developers:
- This README
- API documentation in `/docs`
- Code comments in implementation files
- Example integration snippets

## Conclusion

The plan-based tracking system provides a robust foundation for monetizing the EduGrade platform while ensuring fair usage and a great user experience. The system is designed to be:

- **User-Friendly**: Clear limits and upgrade paths
- **Secure**: Server-side enforcement
- **Scalable**: Efficient database queries and caching
- **Flexible**: Easy to add new plans and features
- **Transparent**: Users always know their usage and limits

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Maintainer**: EduGrade Development Team
