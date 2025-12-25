/**
 * Full flow test: Schema -> Columns -> Evaluation -> Mapping
 */

// Schema from user's example
const userSchema = {
  "title": "Extracted Rubric",
  "total_marks": 25,
  "format_type": "dot_notation",
  "tasks": [
    {
      "task_id": "1",
      "title": "Task 1",
      "max_marks": 2,
      "sub_tasks": [
        { "sub_task_id": "1.1", "description": "Missing data removal or imputation", "marks": 1 },
        { "sub_task_id": "1.2", "description": "Feature and class encoding", "marks": 0.5 },
        { "sub_task_id": "1.3", "description": "Rescaling attributes", "marks": 0.5 }
      ]
    },
    {
      "task_id": "2",
      "title": "Task 2",
      "max_marks": 3,
      "sub_tasks": [
        { "sub_task_id": "2.1", "description": "Shallow neural net for classification", "marks": 1 },
        { "sub_task_id": "2.2", "description": "Tree-based and Ensemble Models for Classification", "marks": 2 }
      ]
    },
    {
      "task_id": "3",
      "title": "Task 3",
      "max_marks": 20,
      "sub_tasks": [
        { "sub_task_id": "3.1", "description": "Preprocessing Analysis", "marks": 2 },
        {
          "sub_task_id": "3.2",
          "description": "Model Fine Tuning",
          "max_marks": 4,
          "sub_tasks": [
            { "sub_task_id": "3.2.1", "description": "Model Fine Tuning - Plots", "marks": 2 },
            { "sub_task_id": "3.2.2", "description": "Model Fine Tuning - Analysis", "marks": 1 },
            { "sub_task_id": "3.2.3", "description": "Model Fine Tuning - Overfitting", "marks": 1 }
          ]
        },
        {
          "sub_task_id": "3.3",
          "description": "Imbalanced Data",
          "max_marks": 7,
          "sub_tasks": [
            { "sub_task_id": "3.3.1", "description": "Imbalanced Data - Detection Code", "marks": 1 },
            { "sub_task_id": "3.3.2", "description": "Imbalanced Data - Identification", "marks": 1 },
            { "sub_task_id": "3.3.3", "description": "Imbalanced Data - Performance Table", "marks": 2 },
            { "sub_task_id": "3.3.4", "description": "Imbalanced Data - Handling", "marks": 2 },
            { "sub_task_id": "3.3.5", "description": "Imbalanced Data - Discussion", "marks": 1 }
          ]
        },
        {
          "sub_task_id": "3.4",
          "description": "Noisy Labels",
          "max_marks": 4,
          "sub_tasks": [
            { "sub_task_id": "3.4.1", "description": "Noisy Labels - Code", "marks": 1 },
            { "sub_task_id": "3.4.2", "description": "Noisy Labels - Retraining & Comparison", "marks": 2 },
            { "sub_task_id": "3.4.3", "description": "Noisy Labels - Robustness", "marks": 1 }
          ]
        },
        {
          "sub_task_id": "3.5",
          "description": "NN Fine Tuning",
          "max_marks": 3,
          "sub_tasks": [
            { "sub_task_id": "3.5.1", "description": "NN Fine Tuning - Experiments", "marks": 1 },
            { "sub_task_id": "3.5.2", "description": "NN Fine Tuning - Overfitting", "marks": 1 },
            { "sub_task_id": "3.5.3", "description": "NN Fine Tuning - Optimal Neurons", "marks": 1 }
          ]
        }
      ]
    }
  ]
};

// Various evaluation result formats that Gemini might return
const evaluationFormats = [
  {
    name: "Format 1: Simple subsections (1, 2, 3)",
    result: {
      overallGrade: 18.5,
      questionScores: [
        {
          questionNumber: "1",
          subsections: [
            { subsectionNumber: "1", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "2", earnedScore: 0.4, maxScore: 0.5 },
            { subsectionNumber: "3", earnedScore: 0.3, maxScore: 0.5 }
          ]
        },
        {
          questionNumber: "2",
          subsections: [
            { subsectionNumber: "1", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "2", earnedScore: 1.8, maxScore: 2 }
          ]
        },
        {
          questionNumber: "3",
          subsections: [
            { subsectionNumber: "1", earnedScore: 1.5, maxScore: 2 },
            { subsectionNumber: "2.1", earnedScore: 1.8, maxScore: 2 },
            { subsectionNumber: "2.2", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "2.3", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "3.1", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "3.2", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "3.3", earnedScore: 1.7, maxScore: 2 },
            { subsectionNumber: "3.4", earnedScore: 1.8, maxScore: 2 },
            { subsectionNumber: "3.5", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "4.1", earnedScore: 0.7, maxScore: 1 },
            { subsectionNumber: "4.2", earnedScore: 1.6, maxScore: 2 },
            { subsectionNumber: "4.3", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "5.1", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "5.2", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "5.3", earnedScore: 0.7, maxScore: 1 }
          ]
        }
      ]
    }
  },
  {
    name: "Format 2: Letter subsections (a, b, c)",
    result: {
      overallGrade: 18.5,
      questionScores: [
        {
          questionNumber: "1",
          subsections: [
            { subsectionNumber: "a", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "b", earnedScore: 0.4, maxScore: 0.5 },
            { subsectionNumber: "c", earnedScore: 0.3, maxScore: 0.5 }
          ]
        },
        {
          questionNumber: "2",
          subsections: [
            { subsectionNumber: "a", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "b", earnedScore: 1.8, maxScore: 2 }
          ]
        },
        {
          questionNumber: "3",
          subsections: [
            { subsectionNumber: "a", earnedScore: 1.5, maxScore: 2 },
            { subsectionNumber: "2a", earnedScore: 1.8, maxScore: 2 },
            { subsectionNumber: "2b", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "2c", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "3a", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "3b", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "3c", earnedScore: 1.7, maxScore: 2 },
            { subsectionNumber: "3d", earnedScore: 1.8, maxScore: 2 },
            { subsectionNumber: "3e", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "4a", earnedScore: 0.7, maxScore: 1 },
            { subsectionNumber: "4b", earnedScore: 1.6, maxScore: 2 },
            { subsectionNumber: "4c", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "5a", earnedScore: 0.9, maxScore: 1 },
            { subsectionNumber: "5b", earnedScore: 0.8, maxScore: 1 },
            { subsectionNumber: "5c", earnedScore: 0.7, maxScore: 1 }
          ]
        }
      ]
    }
  }
];

// Current normalizeSubtaskKey from submissionController.js
function normalizeSubtaskKey(qNum, subsecNum) {
  if (!subsecNum) return String(qNum);

  const qNumStr = String(qNum).trim();
  let normalized = String(subsecNum).trim();

  normalized = normalized.replace(/^(Task|Question|Q)\s*/i, '');

  normalized = normalized.replace(/(\d+(?:\.\d+)*)\(([^)]+)\)/g, (match, prefix, content) => {
    const contentTrimmed = content.trim();
    const romanMap = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    };
    if (romanMap[contentTrimmed.toLowerCase()]) {
      return `${prefix}.${romanMap[contentTrimmed.toLowerCase()]}`;
    }
    if (/^[a-z]$/i.test(contentTrimmed)) {
      const num = contentTrimmed.toLowerCase().charCodeAt(0) - 96;
      return `${prefix}.${num}`;
    }
    return `${prefix}.${contentTrimmed}`;
  });

  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
  };
  if (romanMap[normalized.toLowerCase()]) {
    normalized = String(romanMap[normalized.toLowerCase()]);
  }

  normalized = normalized.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
    const num = letter.toLowerCase().charCodeAt(0) - 96;
    return `${prefix}.${num}`;
  });

  normalized = normalized.replace(/(\d+(?:\.\d+)*)([ivx]+)$/i, (match, prefix, roman) => {
    const num = romanMap[roman.toLowerCase()];
    return num ? `${prefix}.${num}` : match;
  });

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

  normalized = normalized.replace(/[^\d.]/g, '');
  normalized = normalized.replace(/^\.+|\.+$/g, '').replace(/\.{2,}/g, '.');

  if (!normalized) return qNumStr;

  return `${qNumStr}.${normalized}`;
}

// Extract schema columns (current implementation)
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

// Main test
console.log('='.repeat(80));
console.log('FULL FLOW TEST: Schema -> Columns -> Evaluation -> Mapping');
console.log('='.repeat(80));
console.log();

// Step 1: Extract columns from schema
console.log('STEP 1: Extract columns from schema');
const { questionKeys, questionMaxScores } = extractSchemaColumns(userSchema.tasks);
const sortedKeys = Array.from(questionKeys).sort((a, b) => 
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
);
console.log(`Columns: ${sortedKeys.join(', ')}`);
console.log();

// Step 2: Test each evaluation format
evaluationFormats.forEach(evalFormat => {
  console.log(`${'─'.repeat(80)}`);
  console.log(`EVALUATION FORMAT: ${evalFormat.name}`);
  console.log(`${'─'.repeat(80)}`);
  console.log();
  
  // Map evaluation results to columns
  const scoreMap = new Map();
  
  evalFormat.result.questionScores.forEach(q => {
    const qNum = String(q.questionNumber || 'Unknown').replace(/^Task\s*/i, '');
    
    if (q.subsections && q.subsections.length > 0) {
      q.subsections.forEach(s => {
        const subsecNum = s.subsectionNumber || '';
        const formattedKey = normalizeSubtaskKey(qNum, subsecNum);
        scoreMap.set(formattedKey, s.earnedScore);
        
        // Also handle full IDs
        if (subsecNum && subsecNum.startsWith(qNum + '.')) {
          scoreMap.set(subsecNum, s.earnedScore);
        }
      });
    } else {
      scoreMap.set(qNum, q.earnedScore);
    }
  });
  
  // Show mapping
  console.log('Mapping results:');
  sortedKeys.forEach(key => {
    const score = scoreMap.get(key);
    const max = questionMaxScores.get(key) || 0;
    const status = score !== undefined ? '✓' : '✗';
    console.log(`  ${status} ${key}: ${score !== undefined ? score : 'MISSING'}/${max}`);
  });
  
  // Verify sum
  let sumFromMap = 0;
  sortedKeys.forEach(key => {
    sumFromMap += scoreMap.get(key) || 0;
  });
  
  const overallGrade = evalFormat.result.overallGrade;
  const difference = Math.abs(sumFromMap - overallGrade);
  
  console.log();
  console.log(`Sum from map: ${sumFromMap}`);
  console.log(`Overall grade: ${overallGrade}`);
  console.log(`Difference: ${difference.toFixed(2)}`);
  console.log(`Result: ${difference <= 0.01 ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});

console.log('='.repeat(80));
console.log('CONCLUSION');
console.log('='.repeat(80));
console.log('The current normalizeSubtaskKey function works for some formats but not others.');
console.log('The issue is that schema columns are in their original format (e.g., "1.1", "3.2.1")');
console.log('but evaluation subsections can be in various formats (e.g., "1", "a", "2.1", "2a").');
console.log();
console.log('The normalizeSubtaskKey function converts evaluation subsections to dot notation,');
console.log('but it has bugs with standalone letters and some edge cases.');
console.log();
console.log('Additionally, the schema columns should be normalized to a canonical format');
console.log('to ensure consistent matching.');

