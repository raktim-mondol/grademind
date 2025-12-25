/**
 * Migration Script: Add lostMarks to existing submissions
 * 
 * This script processes all existing submissions and calculates lostMarks
 * from their questionScores if lostMarks is missing or empty.
 * 
 * Usage: node migrate_add_lost_marks.js
 */

const mongoose = require('mongoose');
const { Submission } = require('./models/submission');
const { calculateLostMarksFromQuestionScores } = require('./utils/geminiService');
require('dotenv').config();

async function migrateSubmissions() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all submissions with completed evaluations
    const submissions = await Submission.find({
      evaluationStatus: 'completed',
      evaluationResult: { $exists: true }
    });

    console.log(`Found ${submissions.length} completed submissions to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const submission of submissions) {
      try {
        const studentInfo = `${submission.studentName || 'Unknown'} (${submission.studentId || 'N/A'})`;
        
        // Check if lostMarks already exists and has data
        if (submission.evaluationResult.lostMarks && 
            Array.isArray(submission.evaluationResult.lostMarks) && 
            submission.evaluationResult.lostMarks.length > 0) {
          console.log(`⏭️  Skipping ${studentInfo} - already has lostMarks (${submission.evaluationResult.lostMarks.length} entries)`);
          skippedCount++;
          continue;
        }

        // Check if questionScores exists
        if (!submission.evaluationResult.questionScores || 
            !Array.isArray(submission.evaluationResult.questionScores) ||
            submission.evaluationResult.questionScores.length === 0) {
          console.log(`⚠️  Skipping ${studentInfo} - no questionScores available`);
          skippedCount++;
          continue;
        }

        // Calculate lostMarks from questionScores
        console.log(`\n🔄 Processing ${studentInfo}...`);
        const lostMarks = calculateLostMarksFromQuestionScores(submission.evaluationResult);

        if (lostMarks.length === 0) {
          console.log(`   ✨ Perfect score - no deductions`);
        } else {
          console.log(`   📊 Found ${lostMarks.length} deductions:`);
          lostMarks.forEach((lm, idx) => {
            console.log(`      ${idx + 1}. ${lm.area}: -${lm.pointsLost} - ${lm.reason.substring(0, 60)}${lm.reason.length > 60 ? '...' : ''}`);
          });
        }

        // Update the submission
        submission.evaluationResult.lostMarks = lostMarks;
        await submission.save();

        console.log(`   ✅ Updated successfully`);
        updatedCount++;

      } catch (error) {
        console.error(`   ❌ Error processing submission ${submission._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary:');
    console.log(`  Total submissions processed: ${submissions.length}`);
    console.log(`  ✅ Updated: ${updatedCount}`);
    console.log(`  ⏭️  Skipped (already had data): ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`${'='.repeat(60)}\n`);

    // Close the connection
    await mongoose.connection.close();
    console.log('✅ Migration completed. Database connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSubmissions();
