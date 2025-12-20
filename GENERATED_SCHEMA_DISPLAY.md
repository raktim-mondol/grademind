# Generated Schema Display Feature

**Date**: December 20, 2025
**Status**: ✅ Completed

## Overview

Added the ability to view the **Generated Schema** in the Assignment Data viewer on the frontend, alongside the existing Assignment Structure, Rubric Criteria, and Solution Key sections.

## What is the Generated Schema?

The Generated Schema (`gradingSchema`) is a structured representation of the grading criteria extracted from the rubric during assignment processing. It's used by the evaluation system to ensure consistent grading across all submissions.

The schema typically includes:
- **Tasks/Questions**: Hierarchical structure of all grading items
- **Subtasks**: Breakdown of each task into specific criteria
- **Marks**: Points allocated for each subtask
- **Total Marks**: Overall assignment score

## Changes Made

### 1. Frontend Changes (`client/src/grademind/Dashboard.js`)

#### Added Schema Accordion Section
Added a new collapsible section to display the Generated Schema, matching the existing UI pattern:

```javascript
{/* Generated Schema Accordion */}
{processingStatus?.gradingSchema && (
  <div className="border-2 border-zinc-200 rounded-lg overflow-hidden hover:border-zinc-300 transition-colors">
    <button
      onClick={() => setActiveDataSection(activeDataSection === 'schema' ? null : 'schema')}
      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
        activeDataSection === 'schema' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 hover:bg-zinc-100'
      }`}
    >
      <h4 className={`text-xs font-bold uppercase tracking-wider ${
        activeDataSection === 'schema' ? 'text-white' : 'text-zinc-600'
      }`}>Generated Schema</h4>
      <svg className={`w-4 h-4 text-zinc-400 transition-transform ${
        activeDataSection === 'schema' ? 'rotate-180 text-white' : ''
      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {activeDataSection === 'schema' && (
      <div className="p-4 border-t-2 border-zinc-200">
        <pre className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 text-xs font-mono text-zinc-700 overflow-x-auto max-h-96">
          {JSON.stringify(processingStatus.gradingSchema, null, 2)}
        </pre>
      </div>
    )}
  </div>
)}
```

#### Updated State Comment
Updated the `activeDataSection` state comment to include 'schema':

```javascript
const [activeDataSection, setActiveDataSection] = useState('assignment'); 
// 'assignment', 'rubric', 'solution', 'schema'
```

### 2. Backend Changes (`server/controllers/assignmentController.js`)

#### Enhanced Status Endpoint Response
Modified the `getProcessingStatus` function to include the `gradingSchema` and `gradingSchemaStatus` fields in the API response:

```javascript
const responseData = {
  assignmentId: assignment._id,
  assignmentProcessingStatus: assignment.processingStatus,
  rubricProcessingStatus: assignment.rubricProcessingStatus,
  solutionProcessingStatus: assignment.solutionProcessingStatus,
  orchestrationStatus: assignment.orchestrationStatus || 'not_needed',
  processingError: assignment.processingError,
  rubricProcessingError: assignment.rubricProcessingError,
  solutionProcessingError: assignment.solutionProcessingError,
  orchestrationError: assignment.orchestrationError,
  evaluationReadyStatus: getEvaluationReadiness(assignment),
  processedData: assignment.processedData || null,
  processedRubric: assignment.processedRubric || null,
  processedSolution: assignment.processedSolution || null,
  gradingSchema: assignment.gradingSchema || null,        // ✅ NEW
  gradingSchemaStatus: assignment.gradingSchemaStatus || 'pending',  // ✅ NEW
  orchestrationData: assignment.orchestratedData ? {
    completenessScore: assignment.orchestratedData.validation?.completenessScore || 0,
    isValid: assignment.orchestratedData.validation?.isValid || false,
    hasWarnings: assignment.orchestratedData.validation?.hasWarnings || false,
    issuesCount: assignment.orchestratedData.validation?.issues?.length || 0,
    recommendationsCount: assignment.orchestratedData.recommendations?.length || 0
  } : null,
  validationResults: assignment.validationResults || null,
  lastUpdated: assignment.updatedAt
};
```

## How to Use

1. **Create an Assignment**: Upload assignment files (PDF) with a rubric
2. **Wait for Processing**: The system will automatically extract the grading schema
3. **View Assignment Data**: 
   - Navigate to the assignment dashboard
   - Click the document icon (📄) in the top-left sidebar header
   - The "Assignment Data" modal will appear
4. **Expand Generated Schema**: Click on the "Generated Schema" accordion to view the extracted schema in JSON format

## UI Flow

```
Dashboard → Click Document Icon → Assignment Data Modal
  ├── Assignment Structure (processedData)
  ├── Rubric Criteria (processedRubric)
  ├── Solution Key (processedSolution)
  └── Generated Schema (gradingSchema) ✅ NEW
```

## Technical Details

### Data Source
- **Field**: `assignment.gradingSchema`
- **Type**: `Mixed` (JSON object)
- **Extracted By**: `rubricProcessor.js` worker
- **Used In**: `evaluationProcessor.js` for consistent grading

### Schema Structure Example
```json
{
  "tasks": [
    {
      "id": "1",
      "title": "Question 1",
      "subtasks": [
        {
          "id": "1.1",
          "description": "Explain the concept",
          "marks": 5
        },
        {
          "id": "1.2",
          "description": "Provide examples",
          "marks": 5
        }
      ],
      "total_marks": 10
    }
  ],
  "total_marks": 100
}
```

### Status Field
- `gradingSchemaStatus`: Tracks the extraction status
  - `pending`: Not yet processed
  - `processing`: Currently extracting
  - `completed`: Successfully extracted
  - `failed`: Extraction failed
  - `not_applicable`: No rubric provided

## Benefits

1. **Transparency**: Instructors can verify the extracted grading criteria
2. **Debugging**: Helps identify issues with rubric extraction
3. **Consistency**: Shows the exact schema used for evaluation
4. **Quality Assurance**: Allows verification before grading submissions

## Testing

To test the feature:

1. Create a new assignment with a rubric
2. Wait for processing to complete
3. Click the document icon in the dashboard
4. Verify that "Generated Schema" appears as the fourth accordion
5. Click to expand and view the JSON schema
6. Verify the schema matches the rubric structure

## Notes

- The Generated Schema only appears if `gradingSchema` is present in the assignment
- The schema is extracted during rubric processing by the `rubricProcessor.js` worker
- The display uses the same UI pattern as other processed data sections for consistency
- The schema is displayed in JSON format with syntax highlighting and scrolling for large schemas

## Related Files

- `client/src/grademind/Dashboard.js` - Frontend UI component
- `server/controllers/assignmentController.js` - Backend status endpoint
- `server/models/assignment.js` - Assignment schema definition
- `server/workers/rubricProcessor.js` - Schema extraction logic
- `server/utils/geminiService.js` - Schema generation using Gemini API

## Future Enhancements

Potential improvements:
1. Add a formatted view (not just raw JSON)
2. Show schema extraction progress/errors
3. Allow manual schema editing
4. Highlight differences between rubric and schema
5. Add schema validation warnings

---

**Implementation Complete** ✅



