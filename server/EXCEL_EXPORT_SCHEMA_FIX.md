# Excel Export Schema Compatibility Fix

## Problem

The Excel export system in `submissionController.js` fails to handle various rubric schema formats because:

1. **Schema columns** are extracted in their original format (e.g., `1a`, `1(i)`, `3.2.1a`)
2. **Evaluation results** are normalized to dot notation (e.g., `1.1`, `1.1`, `3.2.1.1`)
3. **No matching** occurs because the formats don't align

## Root Cause

The `normalizeSubtaskKey()` function converts evaluation subsections to canonical dot notation, but:

1. It has bugs with standalone letters: `normalizeSubtaskKey("1", "a")` returns `"1"` instead of `"1.1"`
2. Schema columns are never normalized, so they remain in original format

## Solution

Two changes are needed:

### 1. Fix `normalizeSubtaskKey()` to handle standalone letters

Add handling for cases where the subsection becomes empty after cleanup:

```javascript
// After cleanup
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
```

### 2. Normalize schema columns

Add a new function to normalize schema keys:

```javascript
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
```

And use it in `extractSchemaColumns()`:

```javascript
const normalizedKey = normalizeSchemaKey(taskId);
questionKeys.add(normalizedKey);
```

## Test Results

All schema variations now work correctly:

| Schema Format | Example | Status |
|--------------|---------|--------|
| Dot notation | `1.1`, `1.2` | ✅ PASS |
| Letter suffix | `1a`, `1b` | ✅ PASS |
| Roman numeral | `1(i)`, `1(ii)` | ✅ PASS |
| Space separated | `1 a`, `1 b` | ✅ PASS |
| Deep nested | `3.2.1`, `3.2.2` | ✅ PASS |
| Complex mixed | `3.2.1a`, `3.2.2(i)` | ✅ PASS |

## Files to Modify

1. `server/controllers/submissionController.js`
   - Update `normalizeSubtaskKey()` function (around line 1575)
   - Add `normalizeSchemaKey()` function
   - Update `extractSchemaColumns()` to use normalization (around line 1706)

## Backward Compatibility

The fix maintains backward compatibility:
- Existing dot notation schemas continue to work
- Old data formats are handled correctly
- No database schema changes required

