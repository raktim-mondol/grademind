/**
 * Test the actual fixed submissionController logic
 */

// Simulate the helper functions from submissionController.js
function romanToNumber(roman) {
  if (!roman) return null;
  const romanLower = roman.toLowerCase().trim();
  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
    'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
    'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20
  };
  return romanMap[romanLower] || null;
}

function isRomanNumeral(str) {
  if (!str) return false;
  return /^[ivx]+$/i.test(str.trim());
}

function letterToNumber(letter) {
  if (!letter || letter.length !== 1) return null;
  const code = letter.toLowerCase().charCodeAt(0);
  if (code >= 97 && code <= 122) {
    return code - 96;
  }
  return null;
}

// Fixed normalizeSubtaskKey
function normalizeSubtaskKey(qNum, subsecNum) {
  if (!subsecNum) return String(qNum);

  const qNumStr = String(qNum).trim();
  let normalized = String(subsecNum).trim();

  // Remove "Task", "Question", "Q" prefixes
  normalized = normalized.replace(/^(Task|Question|Q)\s*/i, '');

  // Handle parenthetical formats
  normalized = normalized.replace(/(\d+(?:\.\d+)*)\(([^)]+)\)/g, (match, prefix, content) => {
    const contentTrimmed = content.trim();

    if (isRomanNumeral(contentTrimmed)) {
      const num = romanToNumber(contentTrimmed);
      return num ? `${prefix}.${num}` : `${prefix}.${contentTrimmed}`;
    }

    if (/^[a-z]$/i.test(contentTrimmed)) {
      const num = letterToNumber(contentTrimmed);
      return num ? `${prefix}.${num}` : `${prefix}.${contentTrimmed}`;
    }

    if (/^[a-z]+$/i.test(contentTrimmed) && contentTrimmed.length <= 2) {
      const num = letterToNumber(contentTrimmed[0]);
      return num ? `${prefix}.${num}` : `${prefix}.${contentTrimmed}`;
    }

    return `${prefix}.${contentTrimmed}`;
  });

  // Handle standalone Roman numerals
  if (isRomanNumeral(normalized)) {
    const num = romanToNumber(normalized);
    if (num) normalized = String(num);
  }

  // Convert letter suffixes
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
    const num = letterToNumber(letter);
    return num ? `${prefix}.${num}` : match;
  });

  // Convert Roman numeral suffixes
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([ivx]+)$/i, (match, prefix, roman) => {
    const num = romanToNumber(roman);
    return num ? `${prefix}.${num}` : match;
  });

  // Handle space-separated formats
  normalized = normalized.replace(/(\d+(?:\.\d+)*)\s+([a-z]+)$/i, (match, prefix, suffix) => {
    if (isRomanNumeral(suffix)) {
      const num = romanToNumber(suffix);
      return num ? `${prefix}.${num}` : `${prefix}.${suffix}`;
    }
    if (suffix.length === 1) {
      const num = letterToNumber(suffix);
      return num ? `${prefix}.${num}` : `${prefix}.${suffix}`;
    }
    return match;
  });

  // Clean up
  normalized = normalized.replace(/[^\d.]/g, '');
  normalized = normalized.replace(/^\.+|\.+$/g, '').replace(/\.{2,}/g, '.');

  // NEW: Handle case where normalized is empty but subsecNum was provided
  if (!normalized && subsecNum) {
    const trimmed = subsecNum.trim();
    if (isRomanNumeral(trimmed)) {
      const num = romanToNumber(trimmed);
      if (num) normalized = String(num);
    } else if (/^[a-z]$/i.test(trimmed)) {
      const num = letterToNumber(trimmed);
      if (num) normalized = String(num);
    } else if (/^\d+$/.test(trimmed)) {
      normalized = trimmed;
    }
  }

  if (!normalized) return qNumStr;

  return `${qNumStr}.${normalized}`;
}

// NEW: Normalize schema key
function normalizeSchemaKey(key) {
  const parts = key.split('.');
  const processed = [];
  
  for (let part of parts) {
    if (/^\d+$/.test(part)) {
      processed.push(part);
      continue;
    }
    
    const normalized = normalizeSubtaskKey('X', part);
    const subParts = normalized.replace(/^X\./, '').split('.');
    processed.push(...subParts);
  }
  
  return processed.join('.');
}

// Extract schema columns (fixed version)
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

// Test with user's original schema
const userSchema = {
  tasks: [
    {
      task_id: "1",
      sub_tasks: [
        { sub_task_id: "1.1", marks: 1 },
        { sub_task_id: "1.2", marks: 0.5 },
        { sub_task_id: "1.3", marks: 0.5 }
      ]
    },
    {
      task_id: "2",
      sub_tasks: [
        { sub_task_id: "2.1", marks: 1 },
        { sub_task_id: "2.2", marks: 2 }
      ]
    },
    {
      task_id: "3",
      sub_tasks: [
        { sub_task_id: "3.1", marks: 2 },
        {
          sub_task_id: "3.2",
          sub_tasks: [
            { sub_task_id: "3.2.1", marks: 2 },
            { sub_task_id: "3.2.2", marks: 1 },
            { sub_task_id: "3.2.3", marks: 1 }
          ]
        },
        {
          sub_task_id: "3.3",
          sub_tasks: [
            { sub_task_id: "3.3.1", marks: 1 },
            { sub_task_id: "3.3.2", marks: 1 },
            { sub_task_id: "3.3.3", marks: 2 },
            { sub_task_id: "3.3.4", marks: 2 },
            { sub_task_id: "3.3.5", marks: 1 }
          ]
        },
        {
          sub_task_id: "3.4",
          sub_tasks: [
            { sub_task_id: "3.4.1", marks: 1 },
            { sub_task_id: "3.4.2", marks: 2 },
            { sub_task_id: "3.4.3", marks: 1 }
          ]
        },
        {
          sub_task_id: "3.5",
          sub_tasks: [
            { sub_task_id: "3.5.1", marks: 1 },
            { sub_task_id: "3.5.2", marks: 1 },
            { sub_task_id: "3.5.3", marks: 1 }
          ]
        }
      ]
    }
  ]
};

// Test with various formats
const testCases = [
  {
    name: "User's Original Schema",
    schema: userSchema,
    expected: ["1.1", "1.2", "1.3", "2.1", "2.2", "3.1", "3.2.1", "3.2.2", "3.2.3", "3.3.1", "3.3.2", "3.3.3", "3.3.4", "3.3.5", "3.4.1", "3.4.2", "3.4.3", "3.5.1", "3.5.2", "3.5.3"]
  },
  {
    name: "Letter Suffix",
    schema: {
      tasks: [
        { sub_task_id: "1a", marks: 1 },
        { sub_task_id: "1b", marks: 1 },
        { sub_task_id: "2a", marks: 2 }
      ]
    },
    expected: ["1.1", "1.2", "2.1"]
  },
  {
    name: "Roman Numeral",
    schema: {
      tasks: [
        { sub_task_id: "1(i)", marks: 1 },
        { sub_task_id: "1(ii)", marks: 1 },
        { sub_task_id: "2(i)", marks: 2 }
      ]
    },
    expected: ["1.1", "1.2", "2.1"]
  },
  {
    name: "Space Separated",
    schema: {
      tasks: [
        { sub_task_id: "1 a", marks: 1 },
        { sub_task_id: "1 b", marks: 1 },
        { sub_task_id: "2 i", marks: 2 }
      ]
    },
    expected: ["1.1", "1.2", "2.1"]
  },
  {
    name: "Complex Mixed",
    schema: {
      tasks: [
        { sub_task_id: "3.2.1a", marks: 1 },
        { sub_task_id: "3.2.1b", marks: 1 },
        { sub_task_id: "3.2.2(i)", marks: 2 }
      ]
    },
    expected: ["3.2.1.1", "3.2.1.2", "3.2.2.1"]
  }
];

console.log('Testing Fixed SubmissionController Logic\n');
console.log('='.repeat(60));

let allPassed = true;

testCases.forEach(test => {
  console.log(`\n${test.name}:`);
  const { questionKeys } = extractSchemaColumns(test.schema.tasks);
  const sortedKeys = Array.from(questionKeys).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
  
  const expected = test.expected.sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
  
  const match = JSON.stringify(sortedKeys) === JSON.stringify(expected);
  
  console.log(`  Got:      ${sortedKeys.join(', ')}`);
  console.log(`  Expected: ${expected.join(', ')}`);
  console.log(`  Result:   ${match ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!match) allPassed = false;
});

console.log('\n' + '='.repeat(60));
console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);

