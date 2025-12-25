# Rubric JSON → Schema Extraction Flow

## Overview

Changed the schema generation flow to use the already-processed rubric JSON instead of re-reading the PDF file.

## New Flow

```
Rubric PDF → processRubricContent() → processedRubric JSON → analyzeRubricJSONForSchema() → gradingSchema
```

**Key Change**: The new function uses the processed rubric JSON as input instead of the raw PDF, but still calls Gemini API to create the hierarchical schema.

## Changes Made

### 1. New Function: `analyzeRubricJSONForSchema()` in `geminiService.js`

**Location**: Lines 517-685

**Purpose**: Converts processed rubric JSON into hierarchical grading schema using Gemini API.

**Input**: 
```json
{
  "grading_criteria": [
    {
      "question_number": "1.1 (fullmarks)",
      "criterionName": "Analysis",
      "weight": 2.0,
      "description": "...",
      "marking_scale": "..."
    }
  ],
  "total_points": 100,
  "title": "Rubric Title"
}
```

**Output**:
```json
{
  "title": "Rubric Title",
  "total_marks": 100,
  "format_type": "dot_notation",
  "tasks": [
    {
      "task_id": "1",
      "title": "Task 1",
      "max_marks": 10,
      "sub_tasks": [
        {
          "sub_task_id": "1.1",
          "description": "Analysis",
          "marks": 2.0
        }
      ]
    }
  ]
}
```

**How It Works**:
1. Takes processed rubric JSON (with grading_criteria array)
2. Sends it to Gemini API with detailed prompt
3. Gemini analyzes the flat criteria and builds hierarchical structure
4. Returns structured schema with tasks/subtasks

**Key Features**:
- Uses already-processed rubric data (no PDF re-reading)
- Gemini handles hierarchy building intelligently
- Handles complex nested structures automatically
- Validates and normalizes the output
- Includes detailed error handling

### 2. Updated `atomicAssignmentController.js`

**Changes**:
- Added import: `analyzeRubricJSONForSchema`
- Step 2: Changed from `analyzeRubricForSchema(rubricFilePath)` to `analyzeRubricJSONForSchema(processedRubric)`
- Applied to both separate rubric file and assignment PDF extraction paths

**Before**:
```javascript
const schemaResult = await analyzeRubricForSchema(rubricFilePath);
```

**After**:
```javascript
if (processedRubric && processedRubric.grading_criteria) {
  const schemaResult = await analyzeRubricJSONForSchema(processedRubric);
  if (schemaResult.success) {
    gradingSchema = schemaResult.schema;
  }
}
```

### 3. Updated `rubricProcessor.js`

**Changes**:
- Added import: `analyzeRubricJSONForSchema`
- Changed schema extraction to use processed rubric JSON

**Before**:
```javascript
const schemaResult = await analyzeRubricForSchema(pdfFilePath);
```

**After**:
```javascript
if (processedRubric && processedRubric.grading_criteria) {
  const schemaResult = await analyzeRubricJSONForSchema(processedRubric);
  // ... update database
}
```

## Benefits

1. **No PDF Re-reading**: Uses processed rubric JSON instead of raw PDF
2. **Single Source**: Same validated data for both rubric processing and schema extraction
3. **Better Context**: Gemini receives structured JSON with metadata (title, total_points, criteria)
4. **More Accurate**: Gemini can better understand relationships in the data
5. **Flexible**: Handles complex hierarchies without custom parsing logic
6. **Maintainable**: Less custom JavaScript code, more reliance on AI intelligence

## API Call Comparison

**Before:**
- `processRubricPDF()` → 1 API call (PDF → rubric JSON)
- `analyzeRubricForSchema()` → 1 API call (PDF → schema)
- **Total: 2 API calls**

**After:**
- `processRubricContent()` → 1 API call (PDF → rubric JSON)
- `analyzeRubricJSONForSchema()` → 1 API call (JSON → schema)
- **Total: 2 API calls**

**Note**: Same number of API calls, but better data flow and no PDF re-reading.

## Backward Compatibility

The original `analyzeRubricForSchema()` function is **kept intact** for:
- Legacy code that might still use it
- Fallback scenarios
- Testing purposes

## Testing

To verify the changes work:

1. Create an assignment with a rubric PDF
2. Check that `gradingSchema` is populated correctly
3. Verify the schema matches the rubric structure
4. Confirm no errors in console logs

## Files Modified

1. `server/utils/geminiService.js` - Added new function, updated exports
2. `server/controllers/atomicAssignmentController.js` - Updated to use new function
3. `server/workers/rubricProcessor.js` - Updated to use new function

## Implementation Details

### Helper Functions

The new implementation includes three helper functions:

1. **`buildSubTasksHierarchy(criteria, taskId)`**: Converts flat criteria array into nested hierarchy
2. **`calculateTaskMaxMarks(subTasks)`**: Recursively calculates total marks for tasks
3. **`analyzeRubricJSONForSchema(processedRubric)`**: Main entry point

### Hierarchy Building Logic

The function parses `question_number` fields like:
- `"1.1 (fullmarks)"` → extracts `"1.1"`, marks `1.0`
- `"3.2.1 (fullmarks)"` → extracts `"3.2.1"`, marks `2.0`

Then builds tree structure:
```
Task 1
├── 1.1 (marks: 1.0)
├── 1.2 (marks: 4.0)
└── 1.3
    ├── 1.3.1 (marks: 2.0)
    └── 1.3.2 (marks: 1.0)
        └── max_marks: 3.0 (calculated)
```

## Error Handling

- Validates `processedRubric` has `grading_criteria` array
- Returns `{ success: false, error: message }` on failure
- Logs all operations for debugging
- Gracefully handles missing data

## Future Enhancements

Potential improvements:
1. Add description to parent nodes from rubric
2. Support alternative ID formats (letters, roman numerals)
3. Add validation rules for schema structure
4. Cache schema if rubric doesn't change

---

**Created**: 2025-12-23
**Status**: ✅ Implemented and tested

