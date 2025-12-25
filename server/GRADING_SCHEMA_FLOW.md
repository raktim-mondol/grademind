# Grading Schema Flow - Complete Analysis

## Question: Is the grading schema correctly provided?

**Answer: YES, the grading schema is correctly provided throughout the entire pipeline.**

## Complete Flow Analysis

### 1. Assignment Creation (Atomic Controller)
**File**: `server/controllers/atomicAssignmentController.js`

```javascript
// When rubric is processed:
const schemaResult = await analyzeRubricJSONForSchema(processedRubric);
if (schemaResult.success) {
  gradingSchema = schemaResult.schema;  // Extracted hierarchical structure
  
  // Build response schema for fast evaluation
  responseSchema = buildEvaluationResponseSchema(
    { gradingSchema },
    null
  );
  
  // Store in database
  await Assignment.findByIdAndUpdate(assignmentId, {
    gradingSchema: gradingSchema,
    gradingSchemaStatus: 'completed',
    responseSchema: responseSchema,
    // ... other fields
  });
}
```

**What happens**: 
- Rubric JSON is converted to hierarchical task/subtask structure
- Response schema is built and stored for fast evaluation
- Both are saved to the assignment document

### 2. Schema Extraction (Rubric Processor)
**File**: `server/workers/rubricProcessor.js`

```javascript
// After rubric processing:
if (processedRubric && processedRubric.grading_criteria) {
  const schemaResult = await analyzeRubricJSONForSchema(processedRubric);
  if (schemaResult.success) {
    gradingSchema = schemaResult.schema;
    
    // Also build response schema
    responseSchema = buildEvaluationResponseSchema(
      { gradingSchema },
      null
    );
    
    await Assignment.findByIdAndUpdate(assignmentId, {
      gradingSchema: gradingSchema,
      gradingSchemaStatus: 'completed',
      responseSchema: responseSchema,
      // ...
    });
  }
}
```

**What happens**:
- Same process as atomic controller
- Ensures schema is extracted even if separate rubric file is uploaded

### 3. Submission Processing
**File**: `server/workers/submissionProcessor.js`

```javascript
// When student submits:
const assignment = await Assignment.findById(submission.assignmentId);

const jobPayload = {
  submissionId,
  assignmentId: submission.assignmentId,
  assignmentData: assignment.processedData,
  gradingSchema: assignment.gradingSchema || null,  // ← PASSED HERE
  assignmentTitle: assignment.title || '',
  assignmentDescription: assignment.description || '',
  rubricData: assignment.processedRubric,
  solutionData: assignment.processedSolution || {},
  // ...
};

await evaluationQueue.createJob(jobPayload).save();
```

**What happens**:
- Retrieves gradingSchema from assignment
- Passes it to evaluation job payload

### 4. Evaluation Processing
**File**: `server/workers/evaluationProcessor.js`

```javascript
// Extract from job payload:
const {
  submissionId,
  assignmentId,
  assignmentData,
  gradingSchema,  // ← EXTRACTED HERE
  // ...
} = job.data;

// Augment assignmentData with gradingSchema:
if (gradingSchema) {
  assignmentData.gradingSchema = gradingSchema;
  console.log(`✓ Using pre-extracted gradingSchema from assignment (${gradingSchema.tasks?.length || 0} tasks)`);
} else {
  console.log(`⚠ No gradingSchema in job payload - will build from rubricData`);
}
```

**What happens**:
- gradingSchema is added to assignmentData
- This ensures it's available for response schema building

### 5. Response Schema Building
**File**: `server/utils/geminiService.js` - `buildEvaluationResponseSchema()`

```javascript
function buildEvaluationResponseSchema(assignmentData, rubricData) {
  // Prefer pre-extracted gradingSchema
  const schemaSource = assignmentData?.gradingSchema || rubricData;
  
  if (assignmentData?.gradingSchema) {
    console.log('✓ Using pre-extracted gradingSchema from assignment');
  } else {
    console.log('⚠ No stored gradingSchema - building from rubricData');
  }
  
  // Extract all subtask IDs and build schema
  const tasks = schemaSource?.tasks || [];
  // ... builds strict JSON schema for Gemini API
}
```

**What happens**:
- Uses stored gradingSchema if available
- Builds strict response schema that enforces format

### 6. Gemini API Call
**File**: `server/utils/geminiService.js` - `evaluateSubmission()`

```javascript
// Get response schema:
let responseSchema = assignmentData?.responseSchema;
if (!responseSchema) {
  responseSchema = buildEvaluationResponseSchema(assignmentData, rubricData);
}

// Call Gemini with schema enforcement:
const modelWithSchema = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  generationConfig: {
    temperature: 1.0,
    maxOutputTokens: 65536,
    responseMimeType: "application/json",
    responseSchema: responseSchema  // ← ENFORCED HERE
  },
  // ...
});

const result = await modelWithSchema.generateContent({ contents });
```

**What happens**:
- Response schema enforces strict JSON structure
- Gemini must return data matching the schema

### 7. Post-Processing (THE FIX)
**File**: `server/utils/geminiService.js` - `recalculateOverallGrade()`

```javascript
// After getting Gemini response:
let parsedResult = JSON.parse(cleanJsonResponse(response));

// CRITICAL FIX: Recalculate overallGrade
parsedResult = recalculateOverallGrade(parsedResult);

function recalculateOverallGrade(evaluationResult) {
  let calculatedOverallGrade = 0;
  
  evaluationResult.questionScores.forEach(qs => {
    if (qs.subsections && qs.subsections.length > 0) {
      qs.subsections.forEach(sub => {
        calculatedOverallGrade += Number(sub.earnedScore || 0);
      });
    } else {
      calculatedOverallGrade += Number(qs.earnedScore || 0);
    }
  });
  
  // Update to match calculated sum
  evaluationResult.overallGrade = calculatedOverallGrade;
  
  return evaluationResult;
}
```

**What happens**:
- Calculates sum of all earned scores
- Updates overallGrade to match
- Ensures consistency regardless of Gemini's response

## Schema Format

### GradingSchema Structure
```javascript
{
  "title": "Rubric title",
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
        },
        {
          "sub_task_id": "1.2",
          "description": "Implementation",
          "marks": 4.0
        },
        {
          "sub_task_id": "1.3",
          "description": "Documentation",
          "max_marks": 4.0,
          "sub_tasks": [
            {
              "sub_task_id": "1.3.1",
              "description": "Code comments",
              "marks": 2.0
            },
            {
              "sub_task_id": "1.3.2",
              "description": "README",
              "marks": 2.0
            }
          ]
        }
      ]
    }
  ]
}
```

### ResponseSchema (Built from GradingSchema)
```javascript
{
  type: "OBJECT",
  properties: {
    overallGrade: { type: "NUMBER" },
    totalPossible: { type: "NUMBER" },
    questionScores: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionNumber: { type: "STRING" },
          earnedScore: { type: "NUMBER" },
          subsections: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                subsectionNumber: { type: "STRING" },
                earnedScore: { type: "NUMBER" },
                // ...
              }
            }
          }
        }
      }
    }
    // ...
  }
}
```

## Verification

To verify grading schema is correctly provided:

### 1. Check Assignment Document
```javascript
const assignment = await Assignment.findById(assignmentId);
console.log('Grading Schema:', assignment.gradingSchema);
console.log('Response Schema:', assignment.responseSchema);
console.log('Schema Status:', assignment.gradingSchemaStatus);
```

### 2. Check Evaluation Job Payload
```javascript
// In submissionProcessor.js, log the payload:
console.log('Job payload gradingSchema:', jobPayload.gradingSchema);
```

### 3. Check Evaluation Processor Logs
```javascript
// Should see:
// ✓ Using pre-extracted gradingSchema from assignment (X tasks)
```

### 4. Check Response Schema Usage
```javascript
// In evaluateSubmission, should see:
// ✓ Using pre-built responseSchema from assignment
// OR
// ⚠ No stored responseSchema found - building from gradingSchema
```

## Conclusion

**The grading schema IS correctly provided** through the entire pipeline:

✅ **Extraction**: `analyzeRubricJSONForSchema()` creates hierarchical structure  
✅ **Storage**: Saved to assignment document as `gradingSchema`  
✅ **Retrieval**: Passed to evaluation job via `gradingSchema` field  
✅ **Usage**: Augments `assignmentData` for response schema building  
✅ **Enforcement**: Response schema enforces strict format on Gemini  
✅ **Validation**: Post-processing ensures overallGrade matches sum  

The fix I implemented ensures that even if Gemini returns an incorrect `overallGrade`, it will be corrected to match the sum of all subtask scores from `questionScores`.


