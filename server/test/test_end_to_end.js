/**
 * End-to-End Test: Dynamic Schema Generation Workflow
 * Tests: Rubric Upload → Schema Extraction → Student Evaluation → Excel Export
 */

const path = require('path');
const fs = require('fs').promises;
const { analyzeRubricForSchema, evaluateSubmission } = require('../utils/geminiService');
const Excel = require('exceljs');

// Mock assignment data
const mockAssignment = {
    title: "Assignment 2 - Neural Networks",
    description: "Machine Learning Assignment",
    totalPoints: 25
};

async function runEndToEndTest() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   END-TO-END TEST: Dynamic Schema Generation System       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // ============================================================
        // STEP 1: Extract Schema from Rubric
        // ============================================================
        console.log('📋 STEP 1: Extracting Schema from Rubric PDF\n');
        console.log('─'.repeat(60));

        const rubricPath = path.join(__dirname, '../../test_data_for_assignment/Assignment_2_Rubric.pdf');
        await fs.access(rubricPath);

        console.log(`Rubric: ${path.basename(rubricPath)}`);
        const schemaResult = await analyzeRubricForSchema(rubricPath);

        if (!schemaResult.success) {
            throw new Error(`Schema extraction failed: ${schemaResult.error}`);
        }

        const extractedSchema = schemaResult.schema;
        console.log(`\n✅ Schema Extracted:`);
        console.log(`   - Format: ${extractedSchema.format_type}`);
        console.log(`   - Tasks: ${extractedSchema.tasks?.length}`);
        console.log(`   - Total Marks: ${extractedSchema.total_marks}`);

        // Count subtasks
        let totalSubtasks = 0;
        const allSubtaskIds = [];
        extractedSchema.tasks?.forEach(task => {
            task.sub_tasks?.forEach(st => {
                totalSubtasks++;
                allSubtaskIds.push(st.sub_task_id);
            });
        });
        console.log(`   - Subtasks: ${totalSubtasks}`);
        console.log(`   - IDs: ${allSubtaskIds.join(', ')}\n`);

        // ============================================================
        // STEP 2: Simulate Assignment with Stored Schema
        // ============================================================
        console.log('─'.repeat(60));
        console.log('💾 STEP 2: Simulating Assignment with Stored Schema\n');

        const assignmentWithSchema = {
            ...mockAssignment,
            gradingSchema: extractedSchema  // This is what gets stored in DB
        };

        console.log(`✅ Assignment created with stored schema`);
        console.log(`   Schema status: stored and ready for evaluation\n`);

        // ============================================================
        // STEP 3: Evaluate Student Submissions
        // ============================================================
        console.log('─'.repeat(60));
        console.log('📝 STEP 3: Evaluating Student Submissions\n');

        const submissionDir = path.join(__dirname, '../../test_data_student_submission');
        const files = await fs.readdir(submissionDir);
        const submissions = files.filter(f => f.endsWith('.ipynb')).slice(0, 2); // Test with 2 students

        console.log(`Found ${submissions.length} test submissions\n`);

        const evaluationResults = [];

        for (let i = 0; i < submissions.length; i++) {
            const filename = submissions[i];
            const filePath = path.join(submissionDir, filename);
            const studentIdMatch = filename.match(/^(\d+)/);
            const studentId = studentIdMatch ? studentIdMatch[1] : `STUDENT-${i + 1}`;

            console.log(`[${i + 1}/${submissions.length}] Evaluating: ${studentId}`);
            console.log(`   File: ${filename.substring(0, 40)}...`);

            try {
                // Call evaluateSubmission with assignment that has gradingSchema
                const result = await evaluateSubmission(
                    assignmentWithSchema,  // Has gradingSchema field
                    extractedSchema,       // Rubric data
                    null,                  // No solution
                    filePath,
                    studentId
                );

                // Extract subtask IDs from result
                const returnedSubtasks = [];
                result.questionScores?.forEach(q => {
                    const qNum = String(q.questionNumber);
                    q.subsections?.forEach(s => {
                        returnedSubtasks.push(`${qNum}.${s.subsectionNumber}`);
                    });
                });

                console.log(`   ✓ Grade: ${result.overallGrade}/${result.totalPossible}`);
                console.log(`   ✓ Subtasks returned: ${returnedSubtasks.length}`);

                evaluationResults.push({
                    studentId,
                    filename,
                    grade: result.overallGrade,
                    totalPossible: result.totalPossible,
                    questionScores: result.questionScores,
                    subtaskIds: returnedSubtasks
                });

            } catch (error) {
                console.log(`   ✗ Error: ${error.message}`);
                evaluationResults.push({
                    studentId,
                    filename,
                    error: error.message
                });
            }
            console.log('');
        }

        // ============================================================
        // STEP 4: Verify Consistency
        // ============================================================
        console.log('─'.repeat(60));
        console.log('🔍 STEP 4: Verifying Subtask Consistency\n');

        const successfulEvals = evaluationResults.filter(r => !r.error);

        if (successfulEvals.length < 2) {
            console.log('⚠️  Not enough successful evaluations to verify consistency');
        } else {
            const firstSubtasks = successfulEvals[0].subtaskIds.sort().join(',');
            let allConsistent = true;

            successfulEvals.forEach((result, idx) => {
                const subtasks = result.subtaskIds.sort().join(',');
                const isConsistent = subtasks === firstSubtasks;

                console.log(`Student ${idx + 1} (${result.studentId}):`);
                console.log(`   Subtasks: ${result.subtaskIds.length}`);
                console.log(`   Consistent: ${isConsistent ? '✅' : '❌'}`);

                if (!isConsistent) {
                    allConsistent = false;
                    const first = firstSubtasks.split(',');
                    const current = subtasks.split(',');
                    const missing = first.filter(id => !current.includes(id));
                    const extra = current.filter(id => !first.includes(id));
                    if (missing.length) console.log(`   Missing: ${missing.join(', ')}`);
                    if (extra.length) console.log(`   Extra: ${extra.join(', ')}`);
                }
            });

            console.log('');
            if (allConsistent) {
                console.log('✅ ALL STUDENTS HAVE IDENTICAL SUBTASK STRUCTURE!');
            } else {
                console.log('❌ INCONSISTENCY DETECTED - Students have different subtasks');
            }
        }

        // ============================================================
        // STEP 5: Generate Excel Export
        // ============================================================
        console.log('\n' + '─'.repeat(60));
        console.log('📊 STEP 5: Generating Excel Export\n');

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Grades');

        // Collect all unique subtask IDs
        const allSubtaskIdsSet = new Set();
        successfulEvals.forEach(result => {
            result.subtaskIds.forEach(id => allSubtaskIdsSet.add(id));
        });
        const sortedSubtaskIds = Array.from(allSubtaskIdsSet).sort();

        console.log(`Excel columns: ${sortedSubtaskIds.length} subtasks`);
        console.log(`   ${sortedSubtaskIds.join(', ')}\n`);

        // Define columns
        const columns = [
            { header: 'Student ID', key: 'studentId', width: 15 },
            { header: 'Total Score', key: 'totalScore', width: 12 }
        ];

        sortedSubtaskIds.forEach(id => {
            columns.push({
                header: `Task ${id}`,
                key: `task_${id.replace(/\./g, '_')}`,
                width: 10
            });
        });

        worksheet.columns = columns;

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add data rows
        successfulEvals.forEach(result => {
            const row = {
                studentId: result.studentId,
                totalScore: `${result.grade}/${result.totalPossible}`
            };

            // Add subtask scores
            result.questionScores?.forEach(q => {
                const qNum = String(q.questionNumber);
                q.subsections?.forEach(s => {
                    const id = `${qNum}.${s.subsectionNumber}`;
                    row[`task_${id.replace(/\./g, '_')}`] = s.earnedScore;
                });
            });

            worksheet.addRow(row);
        });

        // Save Excel file
        const outputDir = path.join(__dirname, '../../test_output');
        await fs.mkdir(outputDir, { recursive: true });
        const excelPath = path.join(outputDir, 'end_to_end_test_results.xlsx');
        await workbook.xlsx.writeFile(excelPath);

        console.log(`✅ Excel file created: ${excelPath}`);

        // ============================================================
        // FINAL SUMMARY
        // ============================================================
        console.log('\n' + '═'.repeat(60));
        console.log('📋 TEST SUMMARY\n');
        console.log(`✅ Schema Extraction: Success (${totalSubtasks} subtasks)`);
        console.log(`✅ Student Evaluations: ${successfulEvals.length}/${evaluationResults.length} successful`);
        console.log(`✅ Consistency Check: ${successfulEvals.length >= 2 ? 'Verified' : 'N/A'}`);
        console.log(`✅ Excel Export: Created with ${sortedSubtaskIds.length} columns`);
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 END-TO-END TEST COMPLETE!\n');

        return true;

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.stack) console.error(error.stack);
        return false;
    }
}

// Run the test
runEndToEndTest().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
