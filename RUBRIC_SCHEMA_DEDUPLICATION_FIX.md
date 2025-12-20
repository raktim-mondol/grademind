# Rubric Schema Deduplication Fix

## Problem Description

During rubric schema extraction, the system had two issues:

### Issue 1: Redundant Task Entries
**Input (from rubric):**
```
Task 1.1 (1)	Task 1.2 (0.5)	Task 1(1.1) (1)	Task 1(1.2) (0.5)
```

**Buggy Output (with duplicates):**
```json
{
  "tasks": [
    {
      "task_id": "1",
      "sub_tasks": [
        {"sub_task_id": "1.1", "marks": 1.0},
        {"sub_task_id": "1.2", "marks": 0.5},
        {"sub_task_id": "1(1.1)", "marks": 1.0},  // DUPLICATE!
        {"sub_task_id": "1(1.2)", "marks": 0.5}   // DUPLICATE!
      ]
    }
  ]
}
```

### Issue 2: Marks Not Extracted from Parentheses
**Input:** `1.2 (4)`  
**Expected:** `{"sub_task_id": "1.2", "marks": 4.0}`  
**Buggy:** Could result in incorrect marks or string values

This happened because:
1. The prompt was not explicit about marks in parentheses
2. No post-processing deduplication was performed
3. Gemini was interpreting the same rubric item in multiple formats

## Root Cause

The `analyzeRubricForSchema` function in `server/utils/geminiService.js` had two issues:

1. **Prompt Ambiguity**: The extraction prompt didn't explicitly forbid duplicate formats
2. **No Deduplication**: After normalization, there was no check to remove duplicates

## Solution

### 1. Enhanced Prompt

Updated the extraction prompt to be extremely explicit:

```javascript
const extractionPrompt = `Analyze this grading rubric and extract the COMPLETE hierarchical task/subtask structure.

=== CRITICAL REQUIREMENTS - READ CAREFULLY ===

**MOST IMPORTANT RULES:**

1. **NO DUPLICATES**
   - NEVER create both "1.1" AND "1(1.1)" - these are the SAME item
   - NEVER create both "Task 1.1" AND "1.1" - use ONLY "1.1"
   - Each unique task/subtask appears EXACTLY ONCE in the output

2. **MARKS IN PARENTHESES = TOTAL MARKS**
   - "1.2 (4)" → sub_task_id: "1.2", marks: 4.0
   - "3(2.1) (2)" → sub_task_id: "3.2.1", marks: 2.0
   - The number in parentheses is ALWAYS the marks for that specific item

... [rest of detailed prompt] ...
```

### 2. Post-Processing Deduplication

Added a deduplication step after normalization:

```javascript
// Remove any duplicate subtasks that may have been created
console.log(`🔧 Removing duplicate subtasks...`);

function removeDuplicateSubtasks(task, level = 0) {
  const indent = '  '.repeat(level);
  
  if (task.sub_tasks && Array.isArray(task.sub_tasks)) {
    const seenIds = new Set();
    const uniqueSubtasks = [];
    
    task.sub_tasks.forEach((subtask, idx) => {
      const subtaskId = subtask.sub_task_id;
      
      if (seenIds.has(subtaskId)) {
        console.log(`${indent}⚠️  REMOVING DUPLICATE: ${subtaskId}`);
      } else {
        seenIds.add(subtaskId);
        uniqueSubtasks.push(subtask);
        
        // Recursively process nested subtasks
        if (subtask.sub_tasks && Array.isArray(subtask.sub_tasks)) {
          removeDuplicateSubtasks(subtask, level + 1);
        }
      }
    });
    
    task.sub_tasks = uniqueSubtasks;
  }
}

extractedSchema.tasks.forEach((task, taskIdx) => {
  removeDuplicateSubtasks(task, 1);
});
```

### 3. Normalization Improvements

The existing normalization function was enhanced with better comments to clarify the conversion rules:

```javascript
// Fix parenthetical format: "3(2.1)" → "3.2.1", "1(a)" → "1.1", "1.1.1(a)" → "1.1.1.1"
// This is the CRITICAL conversion that prevents duplicates like "1(1.1)"
normalizedId = normalizedId.replace(/(\d+(?:\.\d+)*)\(([^)]+)\)/g, (match, prefix, content) => {
  // ... conversion logic ...
});
```

## Files Modified

- `server/utils/geminiService.js` - Updated `analyzeRubricForSchema` function

## Testing

A comprehensive test suite was created: `server/test-schema-deduplication.js`

Run it with:
```bash
cd server
node test-schema-deduplication.js
```

The test verifies:
1. Mock data with duplicates is properly cleaned
2. Real rubric files don't produce duplicates
3. All nested levels are checked for duplicates

## Expected Behavior

**After Fix:**

Input rubric with: `Task 1.1 (1)	Task 1.2 (0.5)	Task 1(1.1) (1)	Task 1(1.2) (0.5)`

Output schema:
```json
{
  "tasks": [
    {
      "task_id": "1",
      "sub_tasks": [
        {"sub_task_id": "1.1", "marks": 1.0},
        {"sub_task_id": "1.2", "marks": 0.5}
      ]
    }
  ]
}
```

**Key Points:**
- ✅ Only ONE entry for "1.1" (not both "1.1" and "1(1.1)")
- ✅ All IDs use dot notation
- ✅ No "Task" prefix
- ✅ No parentheses format
- ✅ Marks preserved correctly

## Verification

To verify the fix works:

1. **Check logs**: During extraction, you should see:
   ```
   🔧 Normalizing task IDs to dot notation format...
   🔧 Removing duplicate subtasks...
   ✓ Schema extracted and normalized: X tasks, Y subtasks, Z marks
   ```

2. **Check database**: After rubric processing, query the assignment:
   ```javascript
   db.assignments.findOne({ _id: ObjectId("...") }, { gradingSchema: 1 })
   ```

3. **Verify no duplicates**: The `gradingSchema.tasks[].sub_tasks` should have unique `sub_task_id` values.

## Related Issues

- Original issue: Rubric schema creating redundant mark entries
- Affects: All rubric extractions with parenthetical or mixed notation
- Impact: Prevents correct evaluation and Excel export

## Future Prevention

1. Always test with rubrics that have mixed notation formats
2. Add schema validation in the extraction pipeline
3. Consider adding unit tests to CI/CD pipeline

