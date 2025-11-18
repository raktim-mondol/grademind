/**
 * Debug script to check what's actually stored in submission evaluationResult
 * Run this to see if questionScores is being saved to the database
 */

const mongoose = require('mongoose');
const { Submission } = require('./models/submission');
const { Assignment } = require('./models/assignment');

async function debugExcelExport() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Get all assignments
    const assignments = await Assignment.find({}).select('title _id');
    console.log(`\nFound ${assignments.length} assignments:`);
    assignments.forEach((a, i) => {
      console.log(`${i + 1}. ${a.title} (ID: ${a._id})`);
    });

    if (assignments.length === 0) {
      console.log('No assignments found. Exiting...');
      process.exit(0);
    }

    // Use the first assignment or specify one
    const assignmentId = assignments[0]._id;
    console.log(`\n=== Using assignment: ${assignments[0].title} (${assignmentId}) ===\n`);

    // Get submissions for this assignment
    const submissions = await Submission.find({ assignmentId }).limit(5);
    console.log(`Found ${submissions.length} submissions\n`);

    submissions.forEach((sub, index) => {
      console.log(`\n====== SUBMISSION ${index + 1}: ${sub.studentId} ======`);
      console.log(`Status: ${sub.evaluationStatus}`);
      console.log(`Has evaluationResult: ${!!sub.evaluationResult}`);
      
      if (sub.evaluationResult) {
        console.log(`\nEvaluationResult keys:`, Object.keys(sub.evaluationResult));
        console.log(`\nFull evaluationResult structure:`);
        console.log(JSON.stringify(sub.evaluationResult, null, 2));
        
        // Check for questionScores
        if (sub.evaluationResult.questionScores) {
          console.log(`\n✓ HAS questionScores (${sub.evaluationResult.questionScores.length} items)`);
          console.log(`questionScores details:`);
          sub.evaluationResult.questionScores.forEach((qs, i) => {
            console.log(`\n  Question ${qs.questionNumber}:`);
            console.log(`    - Earned: ${qs.earnedScore}/${qs.maxScore}`);
            console.log(`    - Subsections: ${qs.subsections ? qs.subsections.length : 0}`);
            if (qs.subsections && qs.subsections.length > 0) {
              qs.subsections.forEach(ss => {
                console.log(`      • ${ss.subsectionNumber}: ${ss.earnedScore}/${ss.maxScore}`);
              });
            }
          });
        } else {
          console.log(`\n✗ NO questionScores field`);
        }

        // Check for criteriaGrades (fallback)
        if (sub.evaluationResult.criteriaGrades) {
          console.log(`\n✓ HAS criteriaGrades (${sub.evaluationResult.criteriaGrades.length} items)`);
          sub.evaluationResult.criteriaGrades.forEach((cg, i) => {
            console.log(`  ${i + 1}. Q${cg.questionNumber}: ${cg.criterionName} - ${cg.score}/${cg.maxScore}`);
          });
        } else {
          console.log(`\n✗ NO criteriaGrades field`);
        }

        // Check overall scores
        console.log(`\nOverall Score: ${sub.evaluationResult.overallGrade}/${sub.evaluationResult.totalPossible}`);
      } else {
        console.log('No evaluation result available');
      }
      console.log(`\n======================================\n`);
    });

    console.log('\n=== ANALYSIS COMPLETE ===\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugExcelExport();
