const mongoose = require('mongoose');
const User = require('./models/user');
const { Assignment } = require('./models/assignment');
const { Submission } = require('./models/submission');
require('dotenv').config({ path: './.env' });

async function testUsageLimits() {
    console.log('🧪 Starting Usage Limit Verification...');

    try {
        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        // 1. Create a Test User (Free Tier)
        const testEmail = `test_limit_${Date.now()}@example.com`;
        const user = new User({
            name: 'Limit Tester',
            email: testEmail,
            password: 'password123',
            role: 'instructor',
            package: { type: 'free', isActive: true }
        });
        await user.save();
        console.log(`✅ Created test user: ${testEmail} (Free Tier)`);

        // 2. Test Assignment Limit (Limit: 1)
        console.log('\n--- Testing Assignment Limits (Limit: 1) ---');

        // Check initial permission
        let check = user.canPerformAction('create_assignment', user.usage.lifetimeAssignmentsCreated);
        console.log(`Permission to create 1st assignment: ${check.allowed}`);

        // Simulate "Create 1st Assignment"
        await user.incrementUsage('assignmentsCreated');
        console.log('Used 1 assignment quota.');

        // Check permission for 2nd
        // Refresh user to get latest usage
        let validUser = await User.findById(user._id);
        check = validUser.canPerformAction('create_assignment', validUser.usage.lifetimeAssignmentsCreated);
        console.log(`Permission to create 2nd assignment: ${check.allowed} (Expected: false)`);
        if (check.allowed) console.error('❌ FAIL: Should prevent 2nd assignment');
        else console.log('✅ PASS: Prevented 2nd assignment');

        // 3. Test Deletion Impact (Should NOT restore lifetime quota)
        console.log('\n--- Testing Deletion (Lifetime Enforcement) ---');
        // Simulate "Delete Assignment"
        await validUser.decrementUsage('assignmentsCreated');
        console.log('Deleted assignment (decremented active count).');

        // Refresh user
        validUser = await User.findById(user._id);
        console.log(`Active Assignments: ${validUser.usage.assignmentsCreated}`);
        console.log(`Lifetime Assignments: ${validUser.usage.lifetimeAssignmentsCreated}`);

        // Check permission again
        check = validUser.canPerformAction('create_assignment', validUser.usage.lifetimeAssignmentsCreated);
        console.log(`Permission to create assignment after deletion: ${check.allowed} (Expected: false)`);
        if (check.allowed) console.error('❌ FAIL: Deletion restored quota (Not Lifetime)!');
        else console.log('✅ PASS: Lifetime limit enforced after deletion.');


        // 4. Test Submission Limit (Limit: 20)
        console.log('\n--- Testing Submission Limits (Limit: 20) ---');
        // Manually set lifetime submissions to 19
        validUser.usage.lifetimeSubmissionsChecked = 19;
        await validUser.save();

        check = validUser.canPerformAction('grade_submission', validUser.usage.lifetimeSubmissionsChecked);
        console.log(`Permission for 20th submission (Current: 19): ${check.allowed}`);

        // Simulate 20th
        await validUser.incrementUsage('totalSubmissionsGraded');

        // Check 21st
        validUser = await User.findById(user._id);
        check = validUser.canPerformAction('grade_submission', validUser.usage.lifetimeSubmissionsChecked);
        console.log(`Permission for 21st submission (Current: 20): ${check.allowed} (Expected: false)`);
        if (check.allowed) console.error('❌ FAIL: Should prevent 21st submission');
        else console.log('✅ PASS: Prevented 21st submission');

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log('\n🧹 Test User Deleted');

    } catch (err) {
        console.error('❌ Error during test:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Done');
    }
}

testUsageLimits();
