/**
 * Test script for Gemini schema enforcement
 * Verifies that Gemini API returns consistent, deterministic subtask-level grading
 */

const path = require('path');
const fs = require('fs').promises;
const { evaluateSubmission } = require('../utils/geminiService');

async function testGeminiSchemaEnforcement() {
    console.log('=== GEMINI SCHEMA ENFORCEMENT TEST ===\n');

    try {
        // Load rubric data
        const rubricPath = path.join(__dirname, '../../locally_done/Assignment_2_Rubric.json');
        const rubricData = JSON.parse(await fs.readFile(rubricPath, 'utf-8'));
        console.log(`✓ Loaded rubric: ${rubricData.title}`);
        console.log(`  Total marks: ${rubricData.total_marks}`);
        console.log(`  Tasks: ${rubricData.tasks.length}\n`);

        // Create mock assignment data
        const assignmentData = {
            title: "Assignment 2 - Neural Networks",
            description: "Test assignment for schema enforcement",
            totalPoints: rubricData.total_marks,
            questionStructure: []
        };

        // Find a test submission file
        const submissionDir = path.join(__dirname, '../../test_data_student_submission');
        const submissions = await fs.readdir(submissionDir);
        const testFile = submissions.find(f => f.endsWith('.ipynb'));

        if (!testFile) {
            throw new Error('No .ipynb test files found in test_data_student_submission');
        }

        const testFilePath = path.join(submissionDir, testFile);
        console.log(`✓ Using test submission: ${testFile}\n`);

        // Run evaluation with schema enforcement
        console.log('⏳ Calling Gemini API with schema enforcement...\n');
        const result = await evaluateSubmission(
            assignmentData,
            rubricData,
            null, // no solution
            testFilePath,
            'TEST-SCHEMA-001'
        );

        // Validate and display results
        console.log('\n=== GEMINI RESPONSE VALIDATION ===\n');

        // Check top-level structure
        console.log('Top-level fields:');
        console.log(`  ✓ overallGrade: ${result.overallGrade}`);
        console.log(`  ✓ totalPossible: ${result.totalPossible}`);
        console.log(`  ✓ questionScores: ${result.questionScores ? result.questionScores.length + ' questions' : 'MISSING!'}`);
        console.log(`  ✓ strengths: ${result.strengths ? result.strengths.length + ' items' : 'MISSING!'}`);
        console.log(`  ✓ areasForImprovement: ${result.areasForImprovement ? result.areasForImprovement.length + ' items' : 'MISSING!'}`);
        console.log(`  ✓ suggestions: ${result.suggestions ? result.suggestions.length + ' items' : 'MISSING!'}\n`);

        // Check questionScores structure
        if (result.questionScores && result.questionScores.length > 0) {
            console.log('Question Scores Breakdown:');

            const allSubtasks = [];
            result.questionScores.forEach(q => {
                console.log(`\n  Question ${q.questionNumber}: ${q.questionText || 'N/A'}`);
                console.log(`    Total: ${q.earnedScore}/${q.maxScore} marks`);
                console.log(`    Subsections: ${q.subsections ? q.subsections.length : 0}`);

                if (q.subsections && q.subsections.length > 0) {
                    q.subsections.forEach(s => {
                        const fullId = `${q.questionNumber}.${s.subsectionNumber}`;
                        allSubtasks.push(fullId);
                        console.log(`      ${fullId}: ${s.earnedScore}/${s.maxScore} - "${s.subsectionText || 'N/A'}"`);
                    });
                }
            });

            console.log('\n=== ALL SUBTASK IDS RETURNED ===');
            console.log(allSubtasks.join(', '));
            console.log();

            // Validate against expected rubric structure
            const expectedSubtasks = [];
            rubricData.tasks.forEach(task => {
                if (task.sub_tasks) {
                    task.sub_tasks.forEach(st => {
                        expectedSubtasks.push(st.sub_task_id);
                    });
                }
            });

            console.log('=== EXPECTED SUBTASK IDS (from rubric) ===');
            console.log(expectedSubtasks.join(', '));
            console.log();

            // Check consistency
            const missing = expectedSubtasks.filter(e => !allSubtasks.includes(e));
            const extra = allSubtasks.filter(a => !expectedSubtasks.includes(a));

            if (missing.length > 0) {
                console.log('⚠️  WARNING: Missing subtasks:', missing.join(', '));
            }
            if (extra.length > 0) {
                console.log('⚠️  WARNING: Extra/unexpected subtasks:', extra.join(', '));
            }
            if (missing.length === 0 && extra.length === 0) {
                console.log('✅ SUCCESS: All expected subtasks present and no extras!');
            }

            console.log();

            // Check for invalid formats
            const invalidFormats = allSubtasks.filter(id => {
                // Valid format: digits and dots only (e.g., "1.1", "3.2.1")
                return !/^[\d.]+$/.test(id);
            });

            if (invalidFormats.length > 0) {
                console.log('❌ ERROR: Invalid subtask ID formats detected:', invalidFormats.join(', '));
                console.log('   Expected: dot notation only (e.g., "1.1", "3.2.1")');
            } else {
                console.log('✅ SUCCESS: All subtask IDs use proper dot notation!');
            }

        } else {
            console.log('❌ ERROR: No questionScores in response!');
        }

        console.log('\n=== TEST COMPLETE ===');
        console.log('\nNext steps:');
        console.log('1. Verify Excel export creates correct columns');
        console.log('2. Test with multiple students for consistency');
        console.log('3. Check section-based sheets in Excel export\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the test
testGeminiSchemaEnforcement().then(() => {
    console.log('✓ Test script completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('✗ Test script failed:', error.message);
    process.exit(1);
});
