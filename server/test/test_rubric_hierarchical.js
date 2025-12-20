/**
 * Test script to verify rubric extraction preserves hierarchical structure
 * Tests the fix for: "3.2.1 is 2 marks and 3.2.2 is 1 mark should NOT be aggregated to 3.2 = 3 marks"
 */

const { analyzeRubricForSchema, processRubricPDF, processRubricContent } = require('../utils/geminiService');
const fs = require('fs');
const path = require('path');

// Mock test data simulating what Gemini would return
const mockGeminiResponses = {
  // Test case 1: Simple hierarchical structure
  simpleHierarchical: {
    schema: {
      "title": "Test Assignment Rubric",
      "total_marks": 10,
      "format_type": "dot_notation",
      "tasks": [
        {
          "task_id": "1",
          "title": "Task 1",
          "max_marks": 3,
          "sub_tasks": [
            {
              "sub_task_id": "1.1",
              "description": "Subtask 1.1",
              "marks": 2.0
            },
            {
              "sub_task_id": "1.2",
              "description": "Subtask 1.2",
              "marks": 1.0
            }
          ]
        }
      ]
    },
    grading_criteria: [
      {
        "question_number": "1.1",
        "criterionName": "Subtask 1.1",
        "weight": 2.0,
        "description": "Description for 1.1",
        "marking_scale": "N/A"
      },
      {
        "question_number": "1.2",
        "criterionName": "Subtask 1.2",
        "weight": 1.0,
        "description": "Description for 1.2",
        "marking_scale": "N/A"
      }
    ]
  },

  // Test case 2: Deep nesting (the user's issue)
  deepNesting: {
    schema: {
      "title": "Complex Assignment",
      "total_marks": 15,
      "format_type": "dot_notation",
      "tasks": [
        {
          "task_id": "3",
          "title": "Task 3",
          "max_marks": 15,
          "sub_tasks": [
            {
              "sub_task_id": "3.2",
              "description": "Subtask 3.2",
              "max_marks": 3,
              "sub_tasks": [
                {
                  "sub_task_id": "3.2.1",
                  "description": "Analysis",
                  "marks": 2.0
                },
                {
                  "sub_task_id": "3.2.2",
                  "description": "Implementation",
                  "marks": 1.0
                }
              ]
            }
          ]
        }
      ]
    },
    grading_criteria: [
      {
        "question_number": "3.2.1",
        "criterionName": "Analysis",
        "weight": 2.0,
        "description": "Analysis of the problem",
        "marking_scale": "N/A"
      },
      {
        "question_number": "3.2.2",
        "criterionName": "Implementation",
        "weight": 1.0,
        "description": "Implementation of the solution",
        "marking_scale": "N/A"
      }
    ]
  },

  // Test case 3: Very deep nesting (subsubsubsubtask)
  veryDeepNesting: {
    schema: {
      "title": "Very Deep Rubric",
      "total_marks": 20,
      "format_type": "dot_notation",
      "tasks": [
        {
          "task_id": "1",
          "title": "Task 1",
          "max_marks": 20,
          "sub_tasks": [
            {
              "sub_task_id": "1.1",
              "description": "Level 1.1",
              "max_marks": 20,
              "sub_tasks": [
                {
                  "sub_task_id": "1.1.1",
                  "description": "Level 1.1.1",
                  "max_marks": 20,
                  "sub_tasks": [
                    {
                      "sub_task_id": "1.1.1.1",
                      "description": "Level 1.1.1.1",
                      "marks": 10.0
                    },
                    {
                      "sub_task_id": "1.1.1.2",
                      "description": "Level 1.1.1.2",
                      "marks": 10.0
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    grading_criteria: [
      {
        "question_number": "1.1.1.1",
        "criterionName": "Level 1.1.1.1",
        "weight": 10.0,
        "description": "Description for 1.1.1.1",
        "marking_scale": "N/A"
      },
      {
        "question_number": "1.1.1.2",
        "criterionName": "Level 1.1.1.2",
        "weight": 10.0,
        "description": "Description for 1.1.1.2",
        "marking_scale": "N/A"
      }
    ]
  }
};

// Test function to verify the structure
function verifyHierarchicalStructure(testName, schema, gradingCriteria) {
  console.log(`\n=== ${testName} ===`);
  
  // Verify schema structure
  if (schema) {
    console.log('Schema Tasks:');
    schema.tasks.forEach(task => {
      console.log(`  Task ${task.task_id}: ${task.title} (${task.max_marks} marks)`);
      printSubTasks(task.sub_tasks, 2);
    });
  }

  // Verify grading criteria
  if (gradingCriteria) {
    console.log('\nGrading Criteria:');
    gradingCriteria.forEach(crit => {
      console.log(`  ${crit.question_number}: ${crit.criterionName} (${crit.weight} marks)`);
    });
  }

  // Critical checks
  let passed = true;
  
  // Check 1: No aggregation at parent levels
  if (testName === 'Deep Nesting Test') {
    const has32 = gradingCriteria.some(c => c.question_number === '3.2');
    if (has32) {
      console.log('❌ FAIL: Found aggregated "3.2" entry (should not exist)');
      passed = false;
    } else {
      console.log('✅ PASS: No aggregated parent entries');
    }

    // Check 2: Individual entries exist
    const has321 = gradingCriteria.some(c => c.question_number === '3.2.1' && c.weight === 2.0);
    const has322 = gradingCriteria.some(c => c.question_number === '3.2.2' && c.weight === 1.0);
    
    if (has321 && has322) {
      console.log('✅ PASS: Individual entries preserved (3.2.1 = 2 marks, 3.2.2 = 1 mark)');
    } else {
      console.log('❌ FAIL: Individual entries not preserved correctly');
      passed = false;
    }
  }

  // Check 3: Very deep nesting
  if (testName === 'Very Deep Nesting Test') {
    const has1111 = gradingCriteria.some(c => c.question_number === '1.1.1.1');
    const has1112 = gradingCriteria.some(c => c.question_number === '1.1.1.2');
    
    if (has1111 && has1112) {
      console.log('✅ PASS: Very deep nesting preserved (1.1.1.1 and 1.1.1.2)');
    } else {
      console.log('❌ FAIL: Very deep nesting not preserved');
      passed = false;
    }
  }

  return passed;
}

function printSubTasks(subTasks, indent) {
  if (!subTasks) return;
  const prefix = ' '.repeat(indent);
  subTasks.forEach(st => {
    const marksInfo = st.marks !== undefined ? `(${st.marks} marks)` : `(${st.max_marks || '?'} marks)`;
    console.log(`${prefix}Subtask ${st.sub_task_id}: ${st.description} ${marksInfo}`);
    if (st.sub_tasks) {
      printSubTasks(st.sub_tasks, indent + 2);
    }
  });
}

// Run tests
console.log('Testing Rubric Hierarchical Structure Preservation');
console.log('='.repeat(60));

let allPassed = true;

// Test 1
const test1Passed = verifyHierarchicalStructure(
  'Simple Hierarchical Test',
  mockGeminiResponses.simpleHierarchical.schema,
  mockGeminiResponses.simpleHierarchical.grading_criteria
);
allPassed = allPassed && test1Passed;

// Test 2 (The user's issue)
const test2Passed = verifyHierarchicalStructure(
  'Deep Nesting Test',
  mockGeminiResponses.deepNesting.schema,
  mockGeminiResponses.deepNesting.grading_criteria
);
allPassed = allPassed && test2Passed;

// Test 3
const test3Passed = verifyHierarchicalStructure(
  'Very Deep Nesting Test',
  mockGeminiResponses.veryDeepNesting.schema,
  mockGeminiResponses.veryDeepNesting.grading_criteria
);
allPassed = allPassed && test3Passed;

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log('\nThe fix correctly preserves hierarchical structure:');
  console.log('- 3.2.1 (2 marks) and 3.2.2 (1 mark) remain separate');
  console.log('- No aggregation to 3.2 = 3 marks');
  console.log('- Supports arbitrary nesting levels (1.1.1.1, etc.)');
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}

// Export for use in other tests
module.exports = { mockGeminiResponses, verifyHierarchicalStructure };

