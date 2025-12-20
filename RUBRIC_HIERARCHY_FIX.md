# Rubric Hierarchical Structure Fix

## Problem Statement

The rubric extraction was incorrectly aggregating marks at parent levels. For example:

**Input Rubric:**
```
3.2.1 - Analysis (2 marks)
3.2.2 - Implementation (1 mark)
```

**Incorrect Behavior (Before Fix):**
- Would create a "3.2" entry with 3 marks
- Would lose the individual breakdown

**Correct Behavior (After Fix):**
- Creates separate entries for 3.2.1 (2 marks) and 3.2.2 (1 mark)
- Preserves exact hierarchical structure
- No aggregation at parent levels

## Root Cause

The prompts in three functions were not explicitly instructing Gemini to:
1. Preserve exact hierarchical IDs
2. Keep individual entries separate
3. Avoid aggregating marks at parent levels
4. Support arbitrary nesting depths

## Solution

Updated prompts in three key functions to enforce strict hierarchical preservation:

### 1. `analyzeRubricForSchema()` - Line 236-304

**Changes:**
- Added explicit instructions to preserve ALL nesting levels
- Added examples showing correct deep nesting (3.2.1, 3.2.2)
- Added requirement: "DO NOT aggregate marks at parent levels"
- Updated normalization logic to handle nested structures recursively

**Key Prompt Additions:**
```
CRITICAL REQUIREMENTS FOR TASK IDs:
1. PRESERVE EXACT HIERARCHY FROM RUBRIC
2. If rubric shows "3.2.1" and "3.2.2" as separate items, KEEP THEM SEPARATE
3. DO NOT aggregate marks at parent levels
4. Preserve ALL nesting levels (1, 1.1, 1.1.1, 1.1.1.1, etc.)
```

### 2. `processRubricPDF()` - Line 2192-2265

**Changes:**
- Updated to preserve hierarchical structure in `grading_criteria` array
- Added explicit examples for deep nesting
- Emphasized flat array with hierarchical IDs

**Key Prompt Additions:**
```
CRITICAL REQUIREMENTS:

1. PRESERVE EXACT HIERARCHY AND MARKS
   - Extract ALL grading criteria exactly as they appear
   - If rubric shows "3.2.1" (2 marks) and "3.2.2" (1 mark), 
     keep them as SEPARATE criteria
   - DO NOT aggregate marks at parent levels
   - Preserve ALL nesting levels

2. IMPORTANT:
   - Each item with marks gets its own criterion entry
   - DO NOT create a "3.2" entry with 3 marks
   - The grading_criteria array should be FLAT but preserve 
     all hierarchical IDs
```

### 3. `processRubricContent()` - Line 3195-3251

**Changes:**
- Same hierarchical preservation as `processRubricPDF`
- Handles text-based rubric extraction
- Maintains consistency across all extraction methods

## Technical Implementation

### Nested Structure Support

The fix supports arbitrary nesting levels:

```
Level 1: "1" → Main task
Level 2: "1.1" → Subtask
Level 3: "1.1.1" → Sub-subtask
Level 4: "1.1.1.1" → Sub-sub-subtask
...
```

### Normalization Logic

Updated recursive normalization function (lines 351-397):

```javascript
function normalizeTaskIds(task, taskIdx, level = 0) {
  // Normalizes IDs at any nesting level
  // Handles: "1(a)", "3.2(b)", "1.1.1(a)", etc.
  // Recursively processes nested sub_tasks
}
```

### Output Format

**Schema Structure (for grading schema):**
```json
{
  "tasks": [
    {
      "task_id": "3",
      "sub_tasks": [
        {
          "sub_task_id": "3.2",
          "sub_tasks": [
            {
              "sub_task_id": "3.2.1",
              "marks": 2.0
            },
            {
              "sub_task_id": "3.2.2",
              "marks": 1.0
            }
          ]
        }
      ]
    }
  ]
}
```

**Grading Criteria Structure (for evaluation):**
```json
{
  "grading_criteria": [
    {
      "question_number": "3.2.1",
      "weight": 2.0,
      "criterionName": "Analysis"
    },
    {
      "question_number": "3.2.2",
      "weight": 1.0,
      "criterionName": "Implementation"
    }
  ]
}
```

## Testing

Created comprehensive test suite: `server/test/test_rubric_hierarchical.js`

**Test Cases:**
1. Simple hierarchical (1.1, 1.2)
2. Deep nesting (3.2.1, 3.2.2) - **The user's issue**
3. Very deep nesting (1.1.1.1, 1.1.1.2)

**Test Results:**
```
✅ ALL TESTS PASSED

The fix correctly preserves hierarchical structure:
- 3.2.1 (2 marks) and 3.2.2 (1 marks) remain separate
- No aggregation to 3.2 = 3 marks
- Supports arbitrary nesting levels (1.1.1.1, etc.)
```

## Impact

### What Changed
- ✅ Preserves exact hierarchical structure from rubric PDFs
- ✅ Supports subsubsubsubtask level (and beyond)
- ✅ No mark aggregation at parent levels
- ✅ Works with all extraction methods (PDF, text, Landing AI)

### What Stayed the Same
- ✅ Backward compatible with existing data
- ✅ Same file upload process
- ✅ Same database schema
- ✅ Same evaluation workflow

## Usage

When uploading a rubric with hierarchical structure:

**Example Rubric:**
```
Assignment 3 - Programming Project

3.2 Code Quality (5 marks total)
  3.2.1 Analysis (2 marks)
    - Proper problem analysis
    - Clear approach documented
  3.2.2 Implementation (3 marks)
    - Code correctness
    - Best practices followed
```

**Extracted Result:**
```json
{
  "grading_criteria": [
    {
      "question_number": "3.2.1",
      "criterionName": "Analysis",
      "weight": 2.0,
      "description": "Proper problem analysis, Clear approach documented",
      "marking_scale": "N/A"
    },
    {
      "question_number": "3.2.2",
      "criterionName": "Implementation",
      "weight": 3.0,
      "description": "Code correctness, Best practices followed",
      "marking_scale": "N/A"
    }
  ],
  "total_points": 5
}
```

## Files Modified

1. `server/utils/geminiService.js`
   - `analyzeRubricForSchema()` - Lines 236-304
   - `processRubricPDF()` - Lines 2192-2265
   - `processRubricContent()` - Lines 3195-3251
   - Normalization logic - Lines 351-397

2. `server/test/test_rubric_hierarchical.js` (NEW)
   - Comprehensive test suite

## Verification

To verify the fix works:

```bash
cd server
node test/test_rubric_hierarchical.js
```

Expected output: ✅ ALL TESTS PASSED

## Related Issues

This fix addresses the issue where:
- Rubric shows: "3.2.1 (2 marks), 3.2.2 (1 mark)"
- System was creating: "3.2 (3 marks)" 
- Should create: "3.2.1 (2 marks), 3.2.2 (1 mark)" separately

The fix ensures the exact hierarchical structure from the PDF is preserved in the extracted data.

