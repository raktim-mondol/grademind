/**
 * Test fixed normalizeSubtaskKey function
 */

// Current (buggy) version
function normalizeSubtaskKey_OLD(qNum, subsecNum) {
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

// Fixed version
function normalizeSubtaskKey_NEW(qNum, subsecNum) {
  if (!subsecNum) return String(qNum);

  const qNumStr = String(qNum).trim();
  let normalized = String(subsecNum).trim();

  // Remove "Task", "Question", "Q" prefixes
  normalized = normalized.replace(/^(Task|Question|Q)\s*/i, '');

  // Handle parenthetical formats: "1(a)" -> "1.1", "1(ii)" -> "1.2", "1(2.1)" -> "1.2.1"
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

  // Standalone Roman numerals: "ii" -> "2", "iv" -> "4"
  const romanMap = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
  };
  if (romanMap[normalized.toLowerCase()]) {
    normalized = String(romanMap[normalized.toLowerCase()]);
  }

  // Letter suffixes: "1a" -> "1.1", "1.2b" -> "1.2.2"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
    const num = letter.toLowerCase().charCodeAt(0) - 96;
    return `${prefix}.${num}`;
  });

  // Roman numeral suffixes: "1ii" -> "1.2", "1.2iii" -> "1.2.3"
  normalized = normalized.replace(/(\d+(?:\.\d+)*)([ivx]+)$/i, (match, prefix, roman) => {
    const num = romanMap[roman.toLowerCase()];
    return num ? `${prefix}.${num}` : match;
  });

  // Space-separated: "1 a" -> "1.1", "1 ii" -> "1.2"
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

  // Clean up any remaining non-numeric/dot characters
  normalized = normalized.replace(/[^\d.]/g, '');

  // Remove leading/trailing dots and collapse multiple dots
  normalized = normalized.replace(/^\.+|\.+$/g, '').replace(/\.{2,}/g, '.');

  // NEW: Handle case where normalized is empty but subsecNum was provided
  // This handles standalone letters like "a", "b", "i", "ii"
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

  // Subsection IDs from Gemini evaluation are ALWAYS relative to the question
  // They should be combined with the question number to form the full ID
  return `${qNumStr}.${normalized}`;
}

// Test cases
const tests = [
  // Basic dot notation
  { q: "1", s: "1", expected: "1.1", desc: "Simple number" },
  { q: "1", s: "2", expected: "1.2", desc: "Simple number 2" },
  
  // Standalone letters
  { q: "1", s: "a", expected: "1.1", desc: "Standalone letter a" },
  { q: "1", s: "b", expected: "1.2", desc: "Standalone letter b" },
  { q: "2", s: "c", expected: "2.3", desc: "Standalone letter c" },
  
  // Standalone roman numerals
  { q: "1", s: "i", expected: "1.1", desc: "Standalone roman i" },
  { q: "1", s: "ii", expected: "1.2", desc: "Standalone roman ii" },
  { q: "2", s: "iii", expected: "2.3", desc: "Standalone roman iii" },
  
  // Letter suffixes
  { q: "1", s: "1a", expected: "1.1", desc: "Letter suffix 1a" },
  { q: "1", s: "1b", expected: "1.2", desc: "Letter suffix 1b" },
  { q: "3", s: "2.1a", expected: "3.2.1.1", desc: "Nested letter suffix" },
  
  // Roman suffixes
  { q: "1", s: "1i", expected: "1.1", desc: "Roman suffix 1i" },
  { q: "1", s: "1ii", expected: "1.2", desc: "Roman suffix 1ii" },
  
  // Parenthetical
  { q: "1", s: "1(a)", expected: "1.1", desc: "Parenthetical 1(a)" },
  { q: "1", s: "1(ii)", expected: "1.2", desc: "Parenthetical 1(ii)" },
  { q: "3", s: "2.2(i)", expected: "3.2.2.1", desc: "Nested parenthetical" },
  
  // Space-separated
  { q: "1", s: "1 a", expected: "1.1", desc: "Space 1 a" },
  { q: "1", s: "1 ii", expected: "1.2", desc: "Space 1 ii" },
  
  // Already full IDs (should still work)
  { q: "3", s: "2.1", expected: "3.2.1", desc: "Full ID 3.2.1" },
  { q: "3", s: "2.1.1", expected: "3.2.1.1", desc: "Full ID 3.2.1.1" },
];

console.log('Testing normalizeSubtaskKey:\n');
console.log('OLD (current) vs NEW (fixed)\n');

let oldPass = 0, newPass = 0;

tests.forEach(test => {
  const oldResult = normalizeSubtaskKey_OLD(test.q, test.s);
  const newResult = normalizeSubtaskKey_NEW(test.q, test.s);
  
  const oldMatch = oldResult === test.expected;
  const newMatch = newResult === test.expected;
  
  if (oldMatch) oldPass++;
  if (newMatch) newPass++;
  
  const status = newMatch ? '✅' : '❌';
  const oldStatus = oldMatch ? '✓' : '✗';
  const newStatus = newMatch ? '✓' : '✗';
  
  console.log(`${status} ${test.desc}`);
  console.log(`   OLD: normalizeSubtaskKey("${test.q}", "${test.s}") = "${oldResult}" ${oldStatus}`);
  console.log(`   NEW: normalizeSubtaskKey("${test.q}", "${test.s}") = "${newResult}" ${newStatus}`);
  console.log(`   Expected: "${test.expected}"`);
  console.log();
});

console.log('='.repeat(60));
console.log(`OLD: ${oldPass}/${tests.length} passed`);
console.log(`NEW: ${newPass}/${tests.length} passed`);
console.log('='.repeat(60));

