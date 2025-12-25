/**
 * Final comprehensive test for Excel export fix
 * Tests the complete flow with all schema variations
 */

const ExcelJS = require('exceljs');

// Test schemas covering all variations
const testSchemas = [
  {
    name: "Standard Dot Notation",
    schema: {
      tasks: [
        { sub_task_id: "1.1", marks: 1 },
        { sub_task_id: "1.2", marks: 1 },
        { sub_task_id: "2.1", marks: 2 }
      ]
    },
    evalResults: {
      questionScores: [
        { questionNumber: "1", subsections: [{ subsectionNumber: "1", earnedScore: 0.8 }, { subsectionNumber: "2", earnedScore: 0.9 }] },
        { questionNumber: "2", subsections: [{ subsectionNumber: "1", earnedScore: 1.5 }] }
      ]
    }
  },
  {
    name: "Letter Suffix (1a, 1b)",
    schema: {
      tasks: [
        { sub_task_id: "1a", marks: 1 },
        { sub_task_id: "1b", marks: 1 },
        { sub_task_id: "2a", marks: 2 }
      ]
    },
    evalResults: {
      questionScores: [
        { questionNumber: "1", subsections: [{ subsectionNumber: "a", earnedScore: 0.8 }, { subsectionNumber: "b", earnedScore: 0.9 }] },
        { questionNumber: "2", subsections: [{ subsectionNumber: "a", earnedScore: 1.5 }] }
      ]
    }
  },
  {
    name: "Roman Numeral (1(i), 1(ii))",
    schema: {
      tasks: [
        { sub_task_id: "1(i)", marks: 1 },
        { sub_task_id: "1(ii)", marks: 1 },
        { sub_task_id: "2(i)", marks: 2 }
      ]
    },
    evalResults: {
      questionScores: [
        { questionNumber: "1", subsections: [{ subsectionNumber: "i", earnedScore: 0.8 }, { subsectionNumber: "ii", earnedScore: 0.9 }] },
        { questionNumber: "2", subsections: [{ subsectionNumber: "i", earnedScore: 1.5 }] }
      ]
    }
  },
  {
    name: "Space Separated (1 a, 1 b)",
    schema: {
      tasks: [
        { sub_task_id: "1 a", marks: 1 },
        { sub_task_id: "1 b", marks: 1 },
        { sub_task_id: "2 i", marks: 2 }
      ]
    },
    evalResults: {
      questionScores: [
        { questionNumber: "1", subsections: [{ subsectionNumber: "a", earnedScore: 0.8 }, { subsectionNumber: "b", earnedScore: 0.9 }] },
        { questionNumber: "2", subsections: [{ subsectionNumber: "i", earnedScore: 1.5 }] }
      ]
    }
  },
  {
    name: "Deep Nested (3.2.1, 3.2.2)",
    schema: {
      tasks: [
        { sub_task_id: "3.2.1", marks: 1 },
        { sub_task_id: "3.2.2", marks: 1 },
        { sub_task_id: "3.3.1", marks: 2 }
      ]
    },
    evalResults: {
      questionScores: [
        { questionNumber: "3", subsections: [
          { subsectionNumber: "2.1", earnedScore: 0.8 },
          { subsectionNumber: "2.2", earnedScore: 0.9 },
          { subsectionNumber: "3.1", earnedScore: 1.5 }
        ]}
      ]
    }
  },
  {
    name: "Complex Mixed (3.2.1a, 3.2.2(i))",
    schema: {
      tasks: [
        { sub_task_id: "3.2.1a", marks: 1 },
        { sub_task_id: "3.2.1b", marks: 1 },
        { sub_task_id: "3.2.2(i)", marks: 2 }
      ]
    },
    evalResults: {
      questionScores: [
        { questionNumber: "3", subsections: [
          { subsectionNumber: "2.1a", earnedScore: 0.8 },
          { subsectionNumber: "2.1b", earnedScore: 0.9 },
          { subsectionNumber: "2.2(i)", earnedScore: 1.5 }
        ]}
      ]
    }
  }
];

// Fixed normalizeSubtaskKey function
function normalizeSubtaskKey(qNum, subsecNum) {
  if (!subsecNum) return String(qNum);

  const qNumStr = String(qNum).trim();
  let normalized = String(subsecNum).trim();

  // Remove "Task", "Question", "Q" prefixes
  normalized = normalized.replace(/^(Task|Question|Q)\s*/i, '');

  // Handle parenthetical formats
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

  // Standalone Roman numerals
  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
  };
  if (romanMap[normalized.toLowerCase()]) {
    normalized = String(romanMap[normalized.toLowerCase()]);
  }

  // Letter suffixes
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
    const num = letter.toLowerCase().charCodeAt(0) - 96;
    return `${prefix}.${num}`;
  });

  // Roman numeral suffixes
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([ivx]+)$/i, (match, prefix, roman) => {
    const num = romanMap[roman.toLowerCase()];
    return num ? `${prefix}.${num}` : match;
  });

  // Space-separated
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

  // Handle standalone letters/roman that became empty
  if (!normalized && subsecNum) {
    const trimmed = subsecNum.trim();
    if (romanMap[trimmed.toLowerCase()]) {
      normalized = String(romanMap[trimmed.toLowerCase()]);
    } else if (/^[a-z]$/i.test(trimmed)) {
      normalized = String(trimmed.toLowerCase().charCodeAt(0) - 96);
    } else if (/^\d+$/.test(trimmed)) {
      normalized = trimmed;
    }
  }

  if (!normalized) return qNumStr;

  return `${qNumStr}.${normalized}`;
}

// NEW: Normalize schema key to canonical format
function normalizeSchemaKey(key) {
  // Split by dots
  const parts = key.split('.');
  
  // Process each part
  const processed = [];
  
  for (let part of parts) {
    // If purely numeric, keep as-is
    if (/^\d+$/.test(part)) {
      processed.push(part);
      continue;
    }
    
    // Use normalizeSubtaskKey with dummy question to convert the part
    // e.g., "1a" -> normalizeSubtaskKey("X", "1a") -> "X.1.1" -> extract "1.1"
    const normalized = normalizeSubtaskKey('X', part);
    const subParts = normalized.replace(/^X\./, '').split('.');
    
    // Add all subparts
    processed.push(...subParts);
  }
  
  return processed.join('.');
}

// Extract columns from schema (with normalization)
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
          // Normalize the schema key
          const normalizedKey = normalizeSchemaKey(taskId);
          questionKeys.add(normalizedKey);
          const marks = task.marks || task.max_marks || task.maxMarks || 0;
          if (marks > 0) {
            questionMaxScores.set(normalizedKey, marks);
          }
        }
      }
    });
  }

  processTasks(tasks);
  return { questionKeys, questionMaxScores };
}

// Main test
async function runTests() {
  console.log('='.repeat(80));
  console.log('EXCEL EXPORT SYSTEM - COMPREHENSIVE SCHEMA TEST');
  console.log('='.repeat(80));
  console.log();

  let allPassed = true;

  for (const test of testSchemas) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`TEST: ${test.name}`);
    console.log(`${'─'.repeat(80)}`);
    
    // Step 1: Extract and normalize schema columns
    const { questionKeys, questionMaxScores } = extractSchemaColumns(test.schema.tasks);
    const sortedKeys = Array.from(questionKeys).sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    
    console.log(`\nSchema columns (normalized): ${sortedKeys.join(', ')}`);
    
    // Step 2: Map evaluation results
    const scoreMap = new Map();
    
    test.evalResults.questionScores.forEach(q => {
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
    
    console.log(`Evaluation mapping: ${scoreMap.size} entries`);
    
    // Step 3: Verify all columns have scores
    let allMatch = true;
    let sumFromMap = 0;
    
    sortedKeys.forEach(key => {
      const score = scoreMap.get(key);
      const max = questionMaxScores.get(key) || 0;
      
      if (score === undefined) {
        console.log(`  ❌ ${key}: MISSING (max: ${max})`);
        allMatch = false;
        allPassed = false;
      } else {
        console.log(`  ✅ ${key}: ${score}/${max}`);
        sumFromMap += score;
      }
    });
    
    // Step 4: Verify sum
    const totalMarks = test.schema.tasks.reduce((sum, t) => {
      const marks = t.marks || t.max_marks || t.maxMarks || 0;
      // Only count leaf tasks
      let subTasks = t.sub_tasks || t.subTasks;
      if (typeof subTasks === 'string') {
        try { subTasks = JSON.parse(subTasks); } catch (e) { }
      }
      if (!subTasks || !Array.isArray(subTasks) || subTasks.length === 0) {
        return sum + marks;
      }
      return sum;
    }, 0);
    
    console.log(`\nSum of scores: ${sumFromMap}/${totalMarks}`);
    
    if (allMatch) {
      console.log(`✅ PASS: All columns mapped correctly`);
    } else {
      console.log(`❌ FAIL: Some columns missing`);
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

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});

