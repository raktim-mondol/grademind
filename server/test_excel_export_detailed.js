/**
 * Detailed Excel Export Test - Debug Version
 * Shows exactly what's happening with normalization
 */

const ExcelJS = require('exceljs');

// Test the problematic schemas
const testSchemas = [
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
    name: "Complex Nested (3.2.1a, 3.2.1b, 3.2.2(i))",
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

// Helper function to normalize subtask key (from submissionController.js)
function normalizeSubtaskKey(qNum, subsecNum) {
  if (!subsecNum) return String(qNum);

  const qNumStr = String(qNum).trim();
  let normalized = String(subsecNum).trim();

  console.log(`    normalizeSubtaskKey("${qNum}", "${subsecNum}")`);
  console.log(`      Initial: "${normalized}"`);

  // Remove "Task", "Question", "Q" prefixes
  normalized = normalized.replace(/^(Task|Question|Q)\s*/i, '');
  console.log(`      After prefix removal: "${normalized}"`);

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
  console.log(`      After parenthetical: "${normalized}"`);

  // Standalone Roman numerals
  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
  };
  if (romanMap[normalized.toLowerCase()]) {
    normalized = String(romanMap[normalized.toLowerCase()]);
  }
  console.log(`      After standalone roman: "${normalized}"`);

  // Letter suffixes: "1a" -> "1.1"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
    const num = letter.toLowerCase().charCodeAt(0) - 96;
    return `${prefix}.${num}`;
  });
  console.log(`      After letter suffix: "${normalized}"`);

  // Roman numeral suffixes: "1ii" -> "1.2"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([ivx]+)$/i, (match, prefix, roman) => {
    const num = romanMap[roman.toLowerCase()];
    return num ? `${prefix}.${num}` : match;
  });
  console.log(`      After roman suffix: "${normalized}"`);

  // Space-separated: "1 a" -> "1.1"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)\s+([a-z]+)$/i, (match, prefix, suffix) => {
    console.log(`        Space-separated match: prefix="${prefix}", suffix="${suffix}"`);
    if (romanMap[suffix.toLowerCase()]) {
      return `${prefix}.${romanMap[suffix.toLowerCase()]}`;
    }
    if (suffix.length === 1) {
      const num = suffix.toLowerCase().charCodeAt(0) - 96;
      return `${prefix}.${num}`;
    }
    return match;
  });
  console.log(`      After space-separated: "${normalized}"`);

  // Clean up
  normalized = normalized.replace(/[^\d.]/g, '');
  console.log(`      After cleanup: "${normalized}"`);

  normalized = normalized.replace(/^\.+|\.+$/g, '').replace(/\.{2,}/g, '.');
  console.log(`      After dot cleanup: "${normalized}"`);

  if (!normalized) {
    console.log(`      Returning qNumStr: "${qNumStr}"`);
    return qNumStr;
  }

  const result = `${qNumStr}.${normalized}`;
  console.log(`      Final result: "${result}"`);
  return result;
}

// Extract columns from schema
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

// Generate mock evaluation that mimics what Gemini would return
function generateMockEvaluation(schema, studentId, studentName) {
  const questionScores = [];
  const criteriaGrades = [];
  let overallGrade = 0;
  
  function traverseTasks(tasks, parentQuestionNum = '') {
    tasks.forEach(task => {
      const taskId = String(task.sub_task_id || task.subTaskId || task.task_id || task.taskId || '').trim();
      
      let subTasks = task.sub_tasks || task.subTasks;
      if (typeof subTasks === 'string') {
        try { subTasks = JSON.parse(subTasks); } catch (e) { }
      }
      
      if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
        traverseTasks(subTasks, parentQuestionNum || taskId);
      } else {
        const maxMarks = task.marks || task.max_marks || task.maxMarks || 0;
        const earnedScore = Math.round((Math.random() * maxMarks * 10)) / 10;
        overallGrade += earnedScore;
        
        // Parse task_id to get question and subsection
        // For "1 a" -> question "1", "a"
        // For "3.2.1a" -> question "3", "2.1a"
        
        let questionNum, subsectionNum;
        
        // Split by dots and spaces to get parts
        const parts = taskId.split(/[.\s]/).filter(p => p.length > 0);
        
        if (parts.length === 1) {
          // Just a number like "1"
          questionNum = parts[0];
          subsectionNum = null;
        } else {
          // Has multiple parts
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
          // No subsections
          questionEntry.maxScore = maxMarks;
          questionEntry.earnedScore = earnedScore;
        }
        
        // Add to criteriaGrades
        criteriaGrades.push({
          questionNumber: questionNum,
          criterionName: `Criterion ${taskId}`,
          score: earnedScore,
          maxScore: maxMarks,
          feedback: `Feedback for ${taskId}`
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

// Main test
async function runDetailedTest() {
  console.log('='.repeat(80));
  console.log('DETAILED EXCEL EXPORT TEST - Debugging Normalization');
  console.log('='.repeat(80));
  console.log();

  for (const testSchema of testSchemas) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`TEST: ${testSchema.name}`);
    console.log(`${'─'.repeat(80)}`);
    console.log();
    
    // Step 1: Extract columns from schema
    console.log('1. Extracting columns from schema:');
    const { questionKeys, questionMaxScores } = extractSchemaColumns(testSchema.schema.tasks);
    const sortedKeys = Array.from(questionKeys).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    console.log(`   Schema columns: ${sortedKeys.join(', ')}`);
    console.log();
    
    // Step 2: Generate mock evaluation
    console.log('2. Generating mock evaluation:');
    const mockEval = generateMockEvaluation(testSchema.schema, 'STU001', 'Test Student');
    console.log(`   Overall grade: ${mockEval.overallGrade}/${testSchema.schema.total_marks}`);
    console.log();
    
    // Step 3: Show questionScores structure
    console.log('3. QuestionScores from evaluation:');
    mockEval.questionScores.forEach(q => {
      console.log(`   Question ${q.questionNumber}:`);
      if (q.subsections && q.subsections.length > 0) {
        q.subsections.forEach(s => {
          console.log(`     - Subsection "${s.subsectionNumber}": ${s.earnedScore}/${s.maxScore}`);
        });
      } else {
        console.log(`     - No subsections: ${q.earnedScore}/${q.maxScore}`);
      }
    });
    console.log();
    
    // Step 4: Map scores using normalizeSubtaskKey
    console.log('4. Mapping scores to columns:');
    const scoreMap = new Map();
    
    mockEval.questionScores.forEach(q => {
      const qNum = String(q.questionNumber || 'Unknown').replace(/^Task\s*/i, '');
      
      if (q.subsections && q.subsections.length > 0) {
        q.subsections.forEach(s => {
          const subsecNum = s.subsectionNumber || '';
          console.log(`   Processing: qNum="${qNum}", subsecNum="${subsecNum}"`);
          
          const formattedKey = normalizeSubtaskKey(qNum, subsecNum);
          console.log(`   -> Mapped to: "${formattedKey}"`);
          scoreMap.set(formattedKey, s.earnedScore);
          
          // Also handle full IDs
          if (subsecNum && subsecNum.startsWith(qNum + '.')) {
            console.log(`   -> Also setting full ID: "${subsecNum}"`);
            scoreMap.set(subsecNum, s.earnedScore);
          }
          console.log();
        });
      } else {
        console.log(`   Processing: qNum="${qNum}" (no subsections)`);
        scoreMap.set(qNum, q.earnedScore);
        console.log();
      }
    });
    
    // Step 5: Show mapping results
    console.log('5. Final score mapping:');
    sortedKeys.forEach(key => {
      const score = scoreMap.get(key);
      const max = questionMaxScores.get(key) || 0;
      const status = score !== undefined ? '✓' : '✗';
      console.log(`   ${status} ${key}: ${score !== undefined ? score : 'MISSING'}/${max}`);
    });
    console.log();
    
    // Step 6: Verify sum
    console.log('6. Verification:');
    let sumFromSubtasks = 0;
    sortedKeys.forEach(key => {
      const score = scoreMap.get(key) || 0;
      sumFromSubtasks += score;
    });
    
    const overallGrade = mockEval.overallGrade;
    const difference = Math.abs(sumFromSubtasks - overallGrade);
    
    console.log(`   Sum of mapped scores: ${sumFromSubtasks}`);
    console.log(`   Overall grade: ${overallGrade}`);
    console.log(`   Difference: ${difference.toFixed(2)}`);
    console.log(`   Result: ${difference <= 0.01 ? '✅ PASS' : '❌ FAIL'}`);
  }
}

runDetailedTest().catch(console.error);

