// Test normalizeSubtaskKey function
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

// Test cases
const tests = [
  { q: "1", s: "1", expected: "1.1" },
  { q: "1", s: "a", expected: "1.1" },
  { q: "1", s: "i", expected: "1.1" },
  { q: "1", s: "1 a", expected: "1.1" },
  { q: "3", s: "2.1", expected: "3.2.1" },
  { q: "3", s: "2.1a", expected: "3.2.1.1" },
  { q: "3", s: "2.2(i)", expected: "3.2.2.1" },
  { q: "1", s: "1a", expected: "1.1" },
  { q: "1", s: "1(i)", expected: "1.1" },
];

console.log('Testing normalizeSubtaskKey:\n');
tests.forEach(test => {
  const result = normalizeSubtaskKey(test.q, test.s);
  const pass = result === test.expected ? '✅' : '❌';
  console.log(`${pass} normalizeSubtaskKey("${test.q}", "${test.s}") = "${result}" (expected: "${test.expected}")`);
});

