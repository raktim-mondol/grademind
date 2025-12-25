/**
 * Comprehensive Excel Export Test
 * Tests the CURRENT implementation and shows what needs to be fixed
 */

const ExcelJS = require('exceljs');

// All test schemas
const testSchemas = [
  {
    name: "Standard Dot Notation (1.1, 1.2)",
    schema: {
      tasks: [
        { sub_task_id: "1.1", marks: 1 },
        { sub_task_id: "1.2", marks: 1 },
        { sub_task_id: "2.1", marks: 2 }
      ]
    },
    evalFormat: { qNum: "1", subsecNum: "1" } // Will become 1.1
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
    evalFormat: { qNum: "1", subsecNum: "a" } // Should become 1.1
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
    evalFormat: { qNum: "1", subsecNum: "i" } // Should become 1.1
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
    evalFormat: { qNum: "1", subsecNum: "a" } // Should become 1.1
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
    evalFormat: { qNum: "3", subsecNum: "2.1" } // Should become 3.2.1
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
    evalFormat: { qNum: "3", subsecNum: "2.1a" } // Should become 3.2.1.1
  }
];

// Current normalizeSubtaskKey function from submissionController.js
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

  if (!normalized) return qNumStr;

  return `${qNumStr}.${normalized}`;
}

// NEW: Normalize schema column keys to canonical format
function normalizeSchemaKey(key) {
  // Split by dots to get parts
  const parts = key.split('.');
  
  // Process each part
  const normalizedParts = parts.map((part, index) => {
    // Skip if already a number
    if (/^\d+$/.test(part)) return part;
    
    // Handle parenthetical: "2.1a" -> ["2", "1a"]
    // But we're processing individual parts, so "1a" needs to become "1"
    // Actually, we need to handle the whole key at once
    
    // Let's use the existing normalizeSubtaskKey but with a dummy question number
    // This will convert "1a" to "1.1", "1(i)" to "1.1", etc.
    // But we need to handle "3.2.1a" properly
    
    // Better approach: recursively normalize
    return part;
  });
  
  // Actually, let's just use normalizeSubtaskKey with proper parameters
  // For "3.2.1a", we need to split it into question "3" and subsection "2.1a"
  // Then normalizeSubtaskKey("3", "2.1a") -> "3.2.1.1"
  
  // But the schema key "3.2.1a" should become "3.2.1.1"
  // And the eval subsection "2.1a" should also become "3.2.1.1"
  
  // So we need a function that normalizes schema keys to canonical dot notation
  
  // Let's parse the key to extract question and subsection
  // For "1a" -> question "1", subsection "a" -> "1.1"
  // For "3.2.1a" -> question "3", subsection "2.1a" -> "3.2.1.1"
  
  // Find the first part that's purely numeric
  let questionNum = null;
  let subsectionParts = [];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (/^\d+$/.test(part)) {
      if (questionNum === null) {
        questionNum = part;
      } else {
        subsectionParts.push(part);
      }
    } else {
      // This part has letters or other characters
      // It could be "1a", "1(i)", "2.1a", etc.
      // We need to parse it
      const parsed = parseMixedPart(part);
      if (parsed.isNumeric) {
        if (questionNum === null) {
          questionNum = parsed.value;
        } else {
          subsectionParts.push(parsed.value);
        }
      } else {
        subsectionParts.push(parsed.value);
      }
    }
  }
  
  // Now we have questionNum and subsectionParts
  // But we need to handle the mixed parts properly
  
  // Actually, let's take a different approach:
  // Normalize the entire key by treating it as if it's a subsection
  // and prepending a dummy question number, then removing it
  
  const dummyKey = normalizeSubtaskKey('X', key);
  // Remove the "X." prefix
  return dummyKey.replace(/^X\./, '');
}

// Helper to parse mixed parts like "1a", "2.1a", "i", etc.
function parseMixedPart(part) {
  // Check if it's purely numeric
  if (/^\d+$/.test(part)) {
    return { isNumeric: true, value: part };
  }
  
  // Check if it's purely letters
  if (/^[a-z]+$/i.test(part)) {
    const romanMap = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    };
    if (romanMap[part.toLowerCase()]) {
      return { isNumeric: true, value: String(romanMap[part.toLowerCase()]) };
    }
    // Single letter
    if (part.length === 1) {
      return { isNumeric: true, value: String(part.toLowerCase().charCodeAt(0) - 96) };
    }
    return { isNumeric: false, value: part };
  }
  
  // Mixed: "1a", "2(i)", etc.
  // Use regex to split
  const match = part.match(/^(\d+)([a-z]+)$/i);
  if (match) {
    const num = match[1];
    const suffix = match[2];
    const romanMap = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    };
    if (romanMap[suffix.toLowerCase()]) {
      return { isNumeric: true, value: `${num}.${romanMap[suffix.toLowerCase()]}` };
    }
    if (suffix.length === 1) {
      return { isNumeric: true, value: `${num}.${suffix.toLowerCase().charCodeAt(0) - 96}` };
    }
    return { isNumeric: false, value: part };
  }
  
  // Check for parenthetical: "2(i)"
  const parenMatch = part.match(/^(\d+)\(([^)]+)\)$/);
  if (parenMatch) {
    const prefix = parenMatch[1];
    const content = parenMatch[2];
    const romanMap = {
      'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
      'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
    };
    if (romanMap[content.toLowerCase()]) {
      return { isNumeric: true, value: `${prefix}.${romanMap[content.toLowerCase()]}` };
    }
    if (/^[a-z]$/i.test(content)) {
      return { isNumeric: true, value: `${prefix}.${content.toLowerCase().charCodeAt(0) - 96}` };
    }
    return { isNumeric: true, value: `${prefix}.${content}` };
  }
  
  return { isNumeric: false, value: part };
}

// Better approach: Normalize schema key by recursively processing it
function normalizeSchemaKeyV2(key) {
  // Split by dots
  const parts = key.split('.');
  
  // Process each part
  const processed = [];
  
  for (let part of parts) {
    // If part is purely numeric, keep it
    if (/^\d+$/.test(part)) {
      processed.push(part);
      continue;
    }
    
    // If part has letters, we need to expand it
    // "1a" -> ["1", "1"]
    // "i" -> ["1"]
    // "2(i)" -> ["2", "1"]
    
    // Use normalizeSubtaskKey with dummy question
    const normalized = normalizeSubtaskKey('X', part);
    const subParts = normalized.replace(/^X\./, '').split('.');
    
    // Add all subparts
    processed.push(...subParts);
  }
  
  return processed.join('.');
}

// Test the current implementation
function testCurrentImplementation() {
  console.log('='.repeat(80));
  console.log('TESTING CURRENT IMPLEMENTATION');
  console.log('='.repeat(80));
  console.log();
  
  let allPassed = true;
  
  for (const test of testSchemas) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Schema: ${test.name}`);
    console.log(`${'─'.repeat(60)}`);
    
    // Extract schema columns (current implementation)
    const schemaKeys = test.schema.tasks.map(t => t.sub_task_id);
    console.log(`Schema keys: ${schemaKeys.join(', ')}`);
    
    // Generate evaluation result
    const evalKey = normalizeSubtaskKey(test.evalFormat.qNum, test.evalFormat.subsecNum);
    console.log(`Eval result key: ${evalKey}`);
    
    // Try to match
    const matches = schemaKeys.map(k => {
      // Current code tries to match schema key with eval key
      // But they're in different formats!
      return { schema: k, eval: evalKey, match: k === evalKey };
    });
    
    const hasMatch = matches.some(m => m.match);
    
    console.log(`\nMatching attempt:`);
    matches.forEach(m => {
      console.log(`  ${m.schema} === ${m.eval} ? ${m.match ? '✅' : '❌'}`);
    });
    
    if (!hasMatch) {
      console.log(`\n❌ FAIL: No match found`);
      allPassed = false;
    } else {
      console.log(`\n✅ PASS: Match found`);
    }
  }
  
  return allPassed;
}

// Test the proposed fix
function testProposedFix() {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('TESTING PROPOSED FIX (Normalize Schema Keys)');
  console.log('='.repeat(80));
  console.log();
  
  let allPassed = true;
  
  for (const test of testSchemas) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Schema: ${test.name}`);
    console.log(`${'─'.repeat(60)}`);
    
    // Extract and normalize schema columns
    const schemaKeys = test.schema.tasks.map(t => normalizeSchemaKeyV2(t.sub_task_id));
    console.log(`Normalized schema keys: ${schemaKeys.join(', ')}`);
    
    // Generate evaluation result
    const evalKey = normalizeSubtaskKey(test.evalFormat.qNum, test.evalFormat.subsecNum);
    console.log(`Eval result key: ${evalKey}`);
    
    // Try to match
    const matches = schemaKeys.map(k => {
      return { schema: k, eval: evalKey, match: k === evalKey };
    });
    
    const hasMatch = matches.some(m => m.match);
    
    console.log(`\nMatching attempt:`);
    matches.forEach(m => {
      console.log(`  ${m.schema} === ${m.eval} ? ${m.match ? '✅' : '❌'}`);
    });
    
    if (!hasMatch) {
      console.log(`\n❌ FAIL: No match found`);
      allPassed = false;
    } else {
      console.log(`\n✅ PASS: Match found`);
    }
  }
  
  return allPassed;
}

// Run tests
const currentResult = testCurrentImplementation();
const proposedResult = testProposedFix();

console.log('\n\n');
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Current Implementation: ${currentResult ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Proposed Fix: ${proposedResult ? '✅ PASS' : '❌ FAIL'}`);
console.log('='.repeat(80));

