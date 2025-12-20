/**
 * Test script for Excel export consistency
 * Grades multiple students and exports results to Excel
 * Verifies all students have consistent column structure
 */

const path = require('path');
const fs = require('fs').promises;
const Excel = require('exceljs');
const { evaluateSubmission } = require('../utils/geminiService');

// Output file path
const OUTPUT_DIR = path.join(__dirname, '../../test_output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'test_grading_export.xlsx');

/**
 * Collect all subtask keys from questionScores
 */
function extractSubtaskKeys(questionScores) {
    const keys = [];
    if (!questionScores || !Array.isArray(questionScores)) return keys;

    questionScores.forEach(q => {
        const qNum = String(q.questionNumber);
        if (q.subsections && q.subsections.length > 0) {
            q.subsections.forEach(s => {
                keys.push(`${qNum}.${s.subsectionNumber}`);
            });
        } else {
            keys.push(qNum);
        }
    });

    return keys;
}

/**
 * Create Excel workbook from grading results
 */
async function createExcelExport(results, rubricData) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Grading Results');

    // Collect ALL unique subtask keys across all students
    const allSubtaskKeys = new Set();
    results.forEach(r => {
        if (r.success && r.result.questionScores) {
            extractSubtaskKeys(r.result.questionScores).forEach(k => allSubtaskKeys.add(k));
        }
    });

    // Sort keys naturally (1.1, 1.2, 2.1, 3.1, 3.2.1, etc.)
    const sortedKeys = Array.from(allSubtaskKeys).sort((a, b) => {
        const partsA = a.split('.').map(p => parseInt(p) || 0);
        const partsB = b.split('.').map(p => parseInt(p) || 0);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const diff = (partsA[i] || 0) - (partsB[i] || 0);
            if (diff !== 0) return diff;
        }
        return 0;
    });

    console.log(`\n📊 Excel Export: ${sortedKeys.length} subtask columns`);
    console.log(`   Columns: ${sortedKeys.join(', ')}`);

    // Get max scores from rubric
    const maxScoreMap = {};
    rubricData.tasks?.forEach(task => {
        task.sub_tasks?.forEach(st => {
            maxScoreMap[st.sub_task_id] = st.marks;
        });
    });

    // Define columns
    const columns = [
        { header: 'Serial No.', key: 'serialNo', width: 10 },
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Total Score', key: 'totalScore', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
    ];

    // Add subtask columns
    sortedKeys.forEach(key => {
        const maxScore = maxScoreMap[key] || '?';
        columns.push({
            header: `Task ${key} (${maxScore})`,
            key: `q_${key.replace(/\./g, '_')}`,
            width: 12
        });
    });

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    let serialNo = 1;
    results.forEach(r => {
        const row = {
            serialNo: serialNo++,
            studentId: r.studentId,
            totalScore: r.success ? `${r.result.overallGrade}/${r.result.totalPossible}` : 'ERROR',
            status: r.success ? 'Graded' : 'Failed'
        };

        // Add subtask scores
        if (r.success && r.result.questionScores) {
            r.result.questionScores.forEach(q => {
                const qNum = String(q.questionNumber);
                if (q.subsections && q.subsections.length > 0) {
                    q.subsections.forEach(s => {
                        const key = `${qNum}.${s.subsectionNumber}`;
                        row[`q_${key.replace(/\./g, '_')}`] = s.earnedScore;
                    });
                }
            });
        }

        worksheet.addRow(row);
    });

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Save workbook
    await workbook.xlsx.writeFile(OUTPUT_FILE);
    console.log(`\n✅ Excel file saved: ${OUTPUT_FILE}`);

    return sortedKeys;
}

/**
 * Verify column consistency across all students
 */
function verifyConsistency(results) {
    console.log('\n=== COLUMN CONSISTENCY CHECK ===\n');

    const studentKeys = [];

    results.forEach((r, idx) => {
        if (r.success && r.result.questionScores) {
            const keys = extractSubtaskKeys(r.result.questionScores);
            studentKeys.push({
                studentId: r.studentId,
                keys: keys.sort().join(',')
            });
            console.log(`  Student ${idx + 1} (${r.studentId}): ${keys.length} subtasks`);
        }
    });

    // Check if all students have same keys
    const uniqueKeysets = new Set(studentKeys.map(s => s.keys));

    if (uniqueKeysets.size === 1) {
        console.log('\n✅ SUCCESS: All students have IDENTICAL subtask columns!');
        return true;
    } else {
        console.log(`\n❌ ERROR: Found ${uniqueKeysets.size} different column structures!`);

        // Show differences
        const firstKeySet = studentKeys[0].keys;
        studentKeys.forEach((s, idx) => {
            if (s.keys !== firstKeySet) {
                console.log(`\n  Student ${idx + 1} differs:`);
                const keys1 = firstKeySet.split(',');
                const keys2 = s.keys.split(',');
                const missing = keys1.filter(k => !keys2.includes(k));
                const extra = keys2.filter(k => !keys1.includes(k));
                if (missing.length) console.log(`    Missing: ${missing.join(', ')}`);
                if (extra.length) console.log(`    Extra: ${extra.join(', ')}`);
            }
        });

        return false;
    }
}

/**
 * Main test function
 */
async function testExcelExport() {
    console.log('=== EXCEL EXPORT CONSISTENCY TEST ===\n');

    try {
        // Load rubric
        const rubricPath = path.join(__dirname, '../../locally_done/Assignment_2_Rubric.json');
        const rubricData = JSON.parse(await fs.readFile(rubricPath, 'utf-8'));
        console.log(`✓ Loaded rubric: ${rubricData.title} (${rubricData.total_marks} marks)`);

        // List expected subtasks from rubric
        const expectedSubtasks = [];
        rubricData.tasks?.forEach(task => {
            task.sub_tasks?.forEach(st => expectedSubtasks.push(st.sub_task_id));
        });
        console.log(`  Expected subtasks: ${expectedSubtasks.join(', ')}\n`);

        // Create mock assignment data
        const assignmentData = {
            title: "Assignment 2 - Neural Networks",
            description: "Test assignment for Excel export verification",
            totalPoints: rubricData.total_marks
        };

        // Get all test submissions
        const submissionDir = path.join(__dirname, '../../test_data_student_submission');
        const files = await fs.readdir(submissionDir);
        const submissions = files.filter(f => f.endsWith('.ipynb'));

        console.log(`Found ${submissions.length} test submissions:\n`);

        // Grade each submission
        const results = [];
        for (let i = 0; i < submissions.length; i++) {
            const filename = submissions[i];
            const filePath = path.join(submissionDir, filename);

            // Extract student ID from filename
            const studentIdMatch = filename.match(/^(\d+)/);
            const studentId = studentIdMatch ? studentIdMatch[1] : `STUDENT-${i + 1}`;

            console.log(`\n[${i + 1}/${submissions.length}] Grading: ${studentId}`);
            console.log(`  File: ${filename.substring(0, 50)}...`);

            try {
                const result = await evaluateSubmission(
                    assignmentData,
                    rubricData,
                    null,
                    filePath,
                    studentId
                );

                const subtaskCount = extractSubtaskKeys(result.questionScores).length;
                console.log(`  ✓ Grade: ${result.overallGrade}/${result.totalPossible} (${subtaskCount} subtasks)`);

                results.push({
                    studentId,
                    filename,
                    success: true,
                    result
                });
            } catch (error) {
                console.log(`  ✗ Error: ${error.message}`);
                results.push({
                    studentId,
                    filename,
                    success: false,
                    error: error.message
                });
            }
        }

        // Summary
        console.log('\n=== GRADING SUMMARY ===');
        console.log(`  Total: ${results.length}`);
        console.log(`  Success: ${results.filter(r => r.success).length}`);
        console.log(`  Failed: ${results.filter(r => !r.success).length}`);

        // Verify consistency
        const isConsistent = verifyConsistency(results);

        // Create Excel export
        if (results.some(r => r.success)) {
            const columns = await createExcelExport(results, rubricData);

            // Compare with expected
            console.log('\n=== COLUMN COMPARISON ===');
            const missing = expectedSubtasks.filter(e => !columns.includes(e));
            const extra = columns.filter(c => !expectedSubtasks.includes(c));

            if (missing.length === 0 && extra.length === 0) {
                console.log('✅ Excel columns EXACTLY match rubric structure!');
            } else {
                if (missing.length) console.log(`⚠️  Missing columns: ${missing.join(', ')}`);
                if (extra.length) console.log(`⚠️  Extra columns: ${extra.join(', ')}`);
            }
        }

        console.log('\n=== TEST COMPLETE ===\n');
        console.log(`Results saved to: ${OUTPUT_FILE}`);
        console.log('Open the Excel file to verify column headers.\n');

        return isConsistent;

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testExcelExport().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
