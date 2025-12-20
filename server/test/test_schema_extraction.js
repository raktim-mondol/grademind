/**
 * Test script for dynamic schema extraction
 * Verifies that rubric analysis extracts correct grading schema
 */

const path = require('path');
const fs = require('fs').promises;
const { analyzeRubricForSchema } = require('../utils/geminiService');

async function testSchemaExtraction() {
    console.log('=== TESTING DYNAMIC SCHEMA EXTRACTION ===\n');

    try {
        // Test with rubric PDF
        const rubricPath = path.join(__dirname, '../../test_data_for_assignment/Assignment_2_Rubric.pdf');

        // Check if file exists
        await fs.access(rubricPath);
        console.log(`✓ Found rubric file: ${rubricPath}\n`);

        console.log('Starting schema extraction...\n');
        const result = await analyzeRubricForSchema(rubricPath);

        if (result.success) {
            console.log('\n=== EXTRACTION SUCCESSFUL ===\n');

            const schema = result.schema;
            console.log('Schema Details:');
            console.log(`  Title: ${schema.title || 'N/A'}`);
            console.log(`  Total Marks: ${schema.total_marks}`);
            console.log(`  Format Type: ${schema.format_type || 'unknown'}`);
            console.log(`  Tasks: ${schema.tasks?.length || 0}`);

            // List all subtasks
            console.log('\nExtracted Subtasks:');
            const allSubtasks = [];
            schema.tasks?.forEach(task => {
                console.log(`  Task ${task.task_id}: ${task.title || 'N/A'} (${task.max_marks} marks)`);
                task.sub_tasks?.forEach(st => {
                    allSubtasks.push(st.sub_task_id);
                    console.log(`    ${st.sub_task_id}: ${st.description?.substring(0, 40) || 'N/A'}... (${st.marks} marks)`);
                });
            });

            console.log(`\n✅ Total subtasks extracted: ${allSubtasks.length}`);
            console.log(`   IDs: ${allSubtasks.join(', ')}`);

            // Compare with expected from JSON rubric
            const jsonRubricPath = path.join(__dirname, '../../locally_done/Assignment_2_Rubric.json');
            try {
                const jsonRubric = JSON.parse(await fs.readFile(jsonRubricPath, 'utf-8'));
                const expectedSubtasks = [];
                jsonRubric.tasks?.forEach(t => t.sub_tasks?.forEach(st => expectedSubtasks.push(st.sub_task_id)));

                console.log(`\nExpected subtasks: ${expectedSubtasks.length}`);
                console.log(`   IDs: ${expectedSubtasks.join(', ')}`);

                const missing = expectedSubtasks.filter(e => !allSubtasks.includes(e));
                const extra = allSubtasks.filter(a => !expectedSubtasks.includes(a));

                if (missing.length === 0 && extra.length === 0) {
                    console.log('\n✅ PERFECT MATCH: Extracted schema matches expected JSON rubric!');
                } else {
                    if (missing.length) console.log(`\n⚠️ Missing: ${missing.join(', ')}`);
                    if (extra.length) console.log(`⚠️ Extra: ${extra.join(', ')}`);
                }
            } catch (e) {
                console.log('\n(Could not compare with JSON rubric - file not found)');
            }

        } else {
            console.log('\n❌ EXTRACTION FAILED:');
            console.log(`   Error: ${result.error}`);
        }

        console.log('\n=== TEST COMPLETE ===\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testSchemaExtraction().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
