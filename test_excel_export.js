/**
 * Excel Export Test Script
 * Tests various rubric schema formats to ensure the export system handles all variations
 */

const ExcelJS = require('exceljs');

// Test schemas with various formats
const testSchemas = [
  {
    name: "Standard Dot Notation (1.1, 1.2, 2.1)",
    schema: {
      title: "Test Assignment 1",
      total_marks: 25,
      format_type: "dot_notation",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 2,
          sub_tasks: [
            { sub_task_id: "1.1", description: "Missing data removal", marks: 1 },
            { sub_task_id: "1.2", description: "Feature encoding", marks: 1 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 3,
          sub_tasks: [
            { sub_task_id: "2.1", description: "Neural net", marks: 1 },
            { sub_task_id: "2.2", description: "Tree models", marks: 2 }
          ]
        }
      ]
    }
  },
  {
    name: "Letter Suffix (1a, 1b, 2a)",
    schema: {
      title: "Test Assignment 2",
      total_marks: 20,
      format_type: "letter_suffix",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 5,
          sub_tasks: [
            { sub_task_id: "1a", description: "Part A", marks: 2 },
            { sub_task_id: "1b", description: "Part B", marks: 3 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 15,
          sub_tasks: [
            { sub_task_id: "2a", description: "Analysis", marks: 5 },
            { sub_task_id: "2b", description: "Implementation", marks: 10 }
          ]
        }
      ]
    }
  },
  {
    name: "Roman Numeral (1(i), 1(ii), 2(i))",
    schema: {
      title: "Test Assignment 3",
      total_marks: 30,
      format_type: "roman_numeral",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 10,
          sub_tasks: [
            { sub_task_id: "1(i)", description: "Subtask i", marks: 4 },
            { sub_task_id: "1(ii)", description: "Subtask ii", marks: 6 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 20,
          sub_tasks: [
            { sub_task_id: "2(i)", description: "Subtask i", marks: 8 },
            { sub_task_id: "2(ii)", description: "Subtask ii", marks: 12 }
          ]
        }
      ]
    }
  },
  {
    name: "Parenthetical (1(a), 1(b), 2(a))",
    schema: {
      title: "Test Assignment 4",
      total_marks: 15,
      format_type: "parenthetical",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 5,
          sub_tasks: [
            { sub_task_id: "1(a)", description: "First part", marks: 2 },
            { sub_task_id: "1(b)", description: "Second part", marks: 3 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 10,
          sub_tasks: [
            { sub_task_id: "2(a)", description: "Analysis", marks: 4 },
            { sub_task_id: "2(b)", description: "Results", marks: 6 }
          ]
        }
      ]
    }
  },
  {
    name: "Deep Nested (3.2.1, 3.2.2, 3.3.1)",
    schema: {
      title: "Test Assignment 5",
      total_marks: 25,
      format_type: "deep_nested",
      tasks: [
        {
          task_id: "3",
          title: "Task 3",
          max_marks: 20,
          sub_tasks: [
            {
              sub_task_id: "3.2",
              description: "Subtask 3.2",
              max_marks: 4,
              sub_tasks: [
                { sub_task_id: "3.2.1", description: "Plots", marks: 2 },
                { sub_task_id: "3.2.2", description: "Analysis", marks: 2 }
              ]
            },
            {
              sub_task_id: "3.3",
              description: "Subtask 3.3",
              max_marks: 7,
              sub_tasks: [
                { sub_task_id: "3.3.1", description: "Detection", marks: 1 },
                { sub_task_id: "3.3.2", description: "Identification", marks: 2 },
                { sub_task_id: "3.3.3", description: "Table", marks: 2 },
                { sub_task_id: "3.3.4", description: "Handling", marks: 2 }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: "Mixed Format (1.1, 2a, 3(i))",
    schema: {
      title: "Test Assignment 6",
      total_marks: 30,
      format_type: "mixed",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 10,
          sub_tasks: [
            { sub_task_id: "1.1", description: "Dot notation", marks: 5 },
            { sub_task_id: "1.2", description: "Dot notation 2", marks: 5 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 10,
          sub_tasks: [
            { sub_task_id: "2a", description: "Letter suffix", marks: 4 },
            { sub_task_id: "2b", description: "Letter suffix 2", marks: 6 }
          ]
        },
        {
          task_id: "3",
          title: "Task 3",
          max_marks: 10,
          sub_tasks: [
            { sub_task_id: "3(i)", description: "Roman numeral", marks: 3 },
            { sub_task_id: "3(ii)", description: "Roman numeral 2", marks: 7 }
          ]
        }
      ]
    }
  },
  {
    name: "Very Deep Nesting (1.2.3.4.5)",
    schema: {
      title: "Test Assignment 7",
      total_marks: 10,
      format_type: "very_deep",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 10,
          sub_tasks: [
            {
              sub_task_id: "1.2",
              description: "Level 2",
              max_marks: 10,
              sub_tasks: [
                {
                  sub_task_id: "1.2.3",
                  description: "Level 3",
                  max_marks: 10,
                  sub_tasks: [
                    {
                      sub_task_id: "1.2.3.4",
                      description: "Level 4",
                      max_marks: 10,
                      sub_tasks: [
                        { sub_task_id: "1.2.3.4.5", description: "Level 5", marks: 10 }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: "Space Separated (1 a, 1 b, 2 i)",
    schema: {
      title: "Test Assignment 8",
      total_marks: 20,
      format_type: "space_separated",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 8,
          sub_tasks: [
            { sub_task_id: "1 a", description: "Part a", marks: 3 },
            { sub_task_id: "1 b", description: "Part b", marks: 5 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 12,
          sub_tasks: [
            { sub_task_id: "2 i", description: "Part i", marks: 4 },
            { sub_task_id: "2 ii", description: "Part ii", marks: 8 }
          ]
        }
      ]
    }
  },
  {
    name: "Multiple Letters (1aa, 1ab, 2aa)",
    schema: {
      title: "Test Assignment 9",
      total_marks: 15,
      format_type: "multiple_letters",
      tasks: [
        {
          task_id: "1",
          title: "Task 1",
          max_marks: 6,
          sub_tasks: [
            { sub_task_id: "1aa", description: "Sub aa", marks: 2 },
            { sub_task_id: "1ab", description: "Sub ab", marks: 2 },
            { sub_task_id: "1ac", description: "Sub ac", marks: 2 }
          ]
        },
        {
          task_id: "2",
          title: "Task 2",
          max_marks: 9,
          sub_tasks: [
            { sub_task_id: "2aa", description: "Sub aa", marks: 3 },
            { sub_task_id: "2ab", description: "Sub ab", marks: 3 },
            { sub_task_id: "2ac", description: "Sub ac", marks: 3 }
          ]
        }
      ]
    }
  },
  {
    name: "Complex Nested with Mixed (3.2.1a, 3.2.1b, 3.2.2(i))",
    schema: {
      title: "Test Assignment 10",
      total_marks: 30,
      format_type: "complex_mixed",
      tasks: [
        {
          task_id: "3",
          title: "Task 3",
          max_marks: 30,
          sub_tasks: [
            {
              sub_task_id: "3.2",
              description: "Subtask 3.2",
              max_marks: 15,
              sub_tasks: [
                {
                  sub_task_id: "3.2.1",
                  description: "Subtask 3.2.1",
                  max_marks: 8,
                  sub_tasks: [
                    { sub_task_id: "3.2.1a", description: "Part a", marks: 3 },
                    { sub_task_id: "3.2.1b", description: "Part b", marks: 5 }
                  ]
                },
                {
                  sub_task_id: "3.2.2",
                  description: "Subtask 3.2.2",
                  max_marks: 7,
                  sub_tasks: [
                    { sub_task_id: "3.2.2(i)", description: "Part i", marks: 3 },
                    { sub_task_id: "3.2.2(ii)", description: "Part ii", marks: 4 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
];

// Mock evaluation results for testing
function generateMockEvaluation(schema, studentId, studentName) {
  const questionScores = [];
  const criteriaGrades = [];
  let overallGrade = 0;
  
  // Helper to traverse schema and generate scores
  function traverseTasks(tasks, parentQuestionNum = '') {
    tasks.forEach(task => {
      const taskId = String(task.sub_task_id || task.task_id || '').trim();
      
      // Check if this task has sub_tasks
      let subTasks = task.sub_tasks || task.subTasks;
      if (typeof subTasks === 'string') {
        try { subTasks = JSON.parse(subTasks); } catch (e) { }
      }
      
      if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
        // This is a parent task, recurse into sub_tasks
        traverseTasks(subTasks, parentQuestionNum || taskId);
      } else {
        // This is a leaf task - generate a score
        const maxMarks = task.marks || task.max_marks || task.maxMarks || 0;
        // Generate random score between 0 and maxMarks
        const earnedScore = Math.round((Math.random() * maxMarks * 10)) / 10;
        overallGrade += earnedScore;
        
        // Determine question number and subsection
        let questionNum, subsectionNum;
        
        // Parse the task_id to separate question and subsection
        // For "1.1" -> question "1", subsection "1"
        // For "1a" -> question "1", subsection "a" (will be normalized to "1.1")
        // For "1(i)" -> question "1", subsection "i" (will be normalized to "1.1")
        // For "3.2.1" -> question "3", subsection "2.1"
        
        const parts = taskId.split(/[.\s]/);
        if (parts.length === 1) {
          // Just a number like "1" - this is a question without subsections
          questionNum = parts[0];
          subsectionNum = null;
        } else {
          // Has dots or spaces
          questionNum = parts[0];
          subsectionNum = parts.slice(1).join('.');
        }
        
        // Add to questionScores
        let questionEntry = questionScores.find(q => q.questionNumber === questionNum);
        if (!questionEntry) {
          questionEntry = {
            questionNumber: questionNum,
            questionText: `Question ${questionNum}`,
            maxScore: 0,
            earnedScore: 0,
            subsections: []
          };
          questionScores.push(questionEntry);
        }
        
        if (subsectionNum) {
          // Add subsection
          questionEntry.subsections.push({
            subsectionNumber: subsectionNum,
            subsectionText: `Subsection ${subsectionNum}`,
            maxScore: maxMarks,
            earnedScore: earnedScore,
            feedback: `Feedback for ${taskId}`
          });
          questionEntry.maxScore += maxMarks;
          questionEntry.earnedScore += earnedScore;
        } else {
          // No subsections - this is the whole question
          questionEntry.maxScore = maxMarks;
          questionEntry.earnedScore = earnedScore;
        }
        
        // Add to criteriaGrades
        criteriaGrades.push({
          questionNumber: questionNum,
          criterionName: `Criterion ${taskId}`,
          score: earnedScore,
          maxScore: maxMarks,
          feedback: `Feedback for ${taskId}: Student demonstrated understanding of the concept.`
        });
      }
    });
  }
  
  traverseTasks(schema.tasks);
  
  return {
    overallGrade: Math.round(overallGrade * 10) / 10,
    totalPossible: schema.total_marks,
    criteriaGrades: criteriaGrades,
    questionScores: questionScores,
    strengths: ["Good understanding", "Clear implementation"],
    areasForImprovement: ["Could add more comments", "Consider edge cases"]
  };
}

// Helper function to normalize subtask key (copied from submissionController.js)
function normalizeSubtaskKey(qNum, subsecNum) {
  if (!subsecNum) return String(qNum);

  const qNumStr = String(qNum).trim();
  let normalized = String(subsecNum).trim();

  // Remove "Task", "Question", "Q" prefixes
  normalized = normalized.replace(/^(Task|Question|Q)\s*/i, '');

  // Handle parenthetical formats
  normalized = normalized.replace(/(\d+(?:\.\d+)*)\(([^)]+)\)/g, (match, prefix, content) => {
    const contentTrimmed = content.trim();
    
    // Roman numerals
    const romanMap = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    };
    if (romanMap[contentTrimmed.toLowerCase()]) {
      return `${prefix}.${romanMap[contentTrimmed.toLowerCase()]}`;
    }
    
    // Single letter
    if (/^[a-z]$/i.test(contentTrimmed)) {
      const num = contentTrimmed.toLowerCase().charCodeAt(0) - 96;
      return `${prefix}.${num}`;
    }
    
    // Otherwise numeric or sub-path
    return `${prefix}.${contentTrimmed}`;
  });

  // Standalone Roman numerals
  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
  };
  if (romanMap[normalized.toLowerCase()]) {
    normalized = String(romanMap[normalized.toLowerCase()]);
  }

  // Letter suffixes: "1a" -> "1.1"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
    const num = letter.toLowerCase().charCodeAt(0) - 96;
    return `${prefix}.${num}`;
  });

  // Roman numeral suffixes: "1ii" -> "1.2"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([ivx]+)$/i, (match, prefix, roman) => {
    const num = romanMap[roman.toLowerCase()];
    return num ? `${prefix}.${num}` : match;
  });

  // Space-separated: "1 a" -> "1.1"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)\s+([a-z]+)$/i, (match, prefix, suffix) => {
    if (romanMap[suffix.toLowerCase()]) {
      return `${prefix}.${romanMap[suffix.toLowerCase()]}`;
    }
    if (suffix.length === 1) {
      const num = suffix.toLowerCase().charCodeAt(0) - 96;
      return `${prefix}.${num}`;
    }
    return match;
  });

  // Clean up
  normalized = normalized.replace(/[^\d.]/g, '');
  normalized = normalized.replace(/^\.+|\.+$/g, '').replace(/\.{2,}/g, '.');

  if (!normalized) return qNumStr;

  return `${qNumStr}.${normalized}`;
}

// Extract columns from schema (copied from submissionController.js)
function extractSchemaColumns(tasks) {
  const questionKeys = new Set();
  const questionMaxScores = new Map();

  function processTasks(taskList) {
    if (!taskList || !Array.isArray(taskList)) return;

    taskList.forEach(task => {
      const taskId = String(task.sub_task_id || task.subTaskId || task.task_id || task.taskId || '').trim();
      let subTasks = task.sub_tasks || task.subTasks;
      
      if (typeof subTasks === 'string') {
        try { subTasks = JSON.parse(subTasks); } catch (e) { }
      }

      if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
        processTasks(subTasks);
      } else {
        if (taskId) {
          questionKeys.add(taskId);
          const marks = task.marks || task.max_marks || task.maxMarks || 0;
          if (marks > 0) {
            questionMaxScores.set(taskId, marks);
          }
        }
      }
    });
  }

  processTasks(tasks);
  return { questionKeys, questionMaxScores };
}

// Main test function
async function runTests() {
  console.log('='.repeat(80));
  console.log('Excel Export System - Schema Compatibility Tests');
  console.log('='.repeat(80));
  console.log();

  let allPassed = true;

  for (const testSchema of testSchemas) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`TEST: ${testSchema.name}`);
    console.log(`${'─'.repeat(80)}`);
    
    try {
      // Step 1: Extract columns from schema
      const { questionKeys, questionMaxScores } = extractSchemaColumns(testSchema.schema.tasks);
      const sortedKeys = Array.from(questionKeys).sort((a, b) => 
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );
      
      console.log(`\n✓ Extracted ${sortedKeys.length} columns: ${sortedKeys.join(', ')}`);
      
      // Step 2: Generate mock evaluation
      const mockEval = generateMockEvaluation(testSchema.schema, 'STU001', 'Test Student');
      console.log(`✓ Generated mock evaluation with overallGrade: ${mockEval.overallGrade}/${testSchema.schema.total_marks}`);
      
      // Step 3: Map scores to columns
      const scoreMap = new Map();
      mockEval.questionScores.forEach(q => {
        const qNum = String(q.questionNumber || 'Unknown').replace(/^Task\s*/i, '');
        
        if (q.subsections && q.subsections.length > 0) {
          q.subsections.forEach(s => {
            const subsecNum = s.subsectionNumber || '';
            const formattedKey = normalizeSubtaskKey(qNum, subsecNum);
            scoreMap.set(formattedKey, s.earnedScore);
            
            // Handle full IDs
            if (subsecNum && subsecNum.startsWith(qNum + '.')) {
              scoreMap.set(subsecNum, s.earnedScore);
            }
          });
        } else {
          scoreMap.set(qNum, q.earnedScore);
        }
      });
      
      // Step 4: Verify sum matches
      let sumFromSubtasks = 0;
      sortedKeys.forEach(key => {
        const score = scoreMap.get(key) || 0;
        sumFromSubtasks += score;
      });
      
      const overallGrade = mockEval.overallGrade;
      const totalPossible = testSchema.schema.total_marks;
      
      console.log(`\n  Score breakdown:`);
      sortedKeys.forEach(key => {
        const score = scoreMap.get(key) || 0;
        const max = questionMaxScores.get(key) || 0;
        console.log(`    ${key}: ${score}/${max}`);
      });
      
      console.log(`\n  Sum of subtask scores: ${sumFromSubtasks}`);
      console.log(`  Overall grade from evaluation: ${overallGrade}`);
      console.log(`  Total possible: ${totalPossible}`);
      
      // Check if sum matches (within rounding tolerance)
      const difference = Math.abs(sumFromSubtasks - overallGrade);
      const tolerance = 0.01;
      
      if (difference <= tolerance) {
        console.log(`\n✅ PASS: Sum matches (difference: ${difference.toFixed(2)})`);
      } else {
        console.log(`\n❌ FAIL: Sum mismatch! Difference: ${difference.toFixed(2)}`);
        allPassed = false;
      }
      
      // Step 5: Verify all schema columns have scores
      const missingColumns = [];
      sortedKeys.forEach(key => {
        if (!scoreMap.has(key)) {
          missingColumns.push(key);
        }
      });
      
      if (missingColumns.length > 0) {
        console.log(`⚠️  WARNING: Missing scores for columns: ${missingColumns.join(', ')}`);
      }
      
      // Step 6: Test Excel generation
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test');
      
      // Create columns
      const columns = [
        { header: 'Student Name', key: 'studentName', width: 25 },
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Total Score', key: 'totalScore', width: 12 },
      ];
      
      sortedKeys.forEach(key => {
        const maxScore = questionMaxScores.get(key) || 0;
        const headerText = maxScore > 0 ? `Task ${key} (${maxScore})` : `Task ${key}`;
        columns.push({ header: headerText, key: `q_${key}`, width: 10 });
      });
      
      worksheet.columns = columns;
      
      // Add row
      const rowData = {
        studentName: 'Test Student',
        studentId: 'STU001',
        totalScore: overallGrade
      };
      
      sortedKeys.forEach(key => {
        rowData[`q_${key}`] = scoreMap.get(key) || 0;
      });
      
      worksheet.addRow(rowData);
      
      // Verify Excel row sum
      let excelSum = 0;
      sortedKeys.forEach(key => {
        excelSum += rowData[`q_${key}`] || 0;
      });
      
      if (Math.abs(excelSum - overallGrade) <= tolerance) {
        console.log(`✅ Excel row data verified: ${excelSum} matches ${overallGrade}`);
      } else {
        console.log(`❌ Excel row data mismatch: ${excelSum} vs ${overallGrade}`);
        allPassed = false;
      }
      
    } catch (error) {
      console.log(`\n❌ ERROR: ${error.message}`);
      console.log(error.stack);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
  console.log('='.repeat(80));
  
  return allPassed;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

