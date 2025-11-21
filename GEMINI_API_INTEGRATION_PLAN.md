# Gemini API Integration Plan for EduGrade

**Date**: 2025-11-21
**Branch**: `claude/plan-gemini-api-integration-019i8qR4fHBcrtQs7Rw5Lwfe`
**Updated**: Added Landing AI API for PDF extraction

---

## Executive Summary

This document outlines the implementation plan for a **two-stage processing pipeline**:
1. **Landing AI API** - Extract content from PDFs
2. **Gemini 2.5 Pro** - Process/evaluate extracted content

---

## 1. New Architecture

### Processing Flow

```
┌─────────────┐     ┌───────────────┐     ┌─────────────┐     ┌──────────┐
│  PDF Upload │────▶│ Landing AI API│────▶│ Gemini API  │────▶│  Result  │
│             │     │ (Extract)     │     │ (Process)   │     │          │
└─────────────┘     └───────────────┘     └─────────────┘     └──────────┘
```

### Assignment Creation Flow

```
1. User uploads Assignment PDF → Landing AI extracts content
2. User uploads Rubric PDF → Landing AI extracts content
3. User uploads Solution PDF → Landing AI extracts content
4. All extracted content → Gemini 2.5 Pro → Assignment structure created
5. Store assignment info in database
```

### Student Evaluation Flow

```
1. Student uploads Submission PDF → Landing AI extracts content
2. Extracted submission + Stored assignment info → Gemini 2.5 Pro
3. Evaluation result stored
4. Repeat for each student
```

---

## 2. Landing AI API Integration

### New Service File

**File**: `server/utils/landingAIService.js`

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const LANDING_AI_API_URL = 'https://api.va.landing.ai/v1/ade/parse';
const LANDING_AI_API_KEY = process.env.LANDING_AI_API_KEY;

/**
 * Extract content from PDF using Landing AI API
 * @param {string} pdfPath - Path to PDF file
 * @returns {Object} Extracted content with text, tables, images
 */
async function extractPDFContent(pdfPath) {
  const form = new FormData();
  form.append('document', fs.createReadStream(pdfPath));
  form.append('model', 'dpt-2-latest');

  try {
    const response = await axios.post(LANDING_AI_API_URL, form, {
      headers: {
        'Authorization': `Bearer ${LANDING_AI_API_KEY}`,
        ...form.getHeaders()
      },
      timeout: 60000 // 60 second timeout
    });

    console.log('✅ Landing AI extraction completed for:', pdfPath);
    return response.data;
  } catch (error) {
    console.error('❌ Landing AI extraction failed:', error.message);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * Extract content with retry logic
 */
async function extractWithRetry(pdfPath, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await extractPDFContent(pdfPath);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

module.exports = {
  extractPDFContent,
  extractWithRetry
};
```

### Environment Variables

```env
# Add to server/.env
LANDING_AI_API_KEY=your_landing_ai_api_key
```

---

## 3. Updated Processing Pipeline

### 3.1 Assignment Processing

**File**: `server/workers/assignmentProcessor.js`

```javascript
const { extractWithRetry } = require('../utils/landingAIService');
const { processAssignmentContent } = require('../utils/geminiService');

async function processAssignment(job) {
  const { assignmentId } = job.data;
  const assignment = await Assignment.findById(assignmentId);

  try {
    // Step 1: Extract PDF content via Landing AI
    console.log('🔄 Extracting assignment PDF via Landing AI...');
    const extractedContent = await extractWithRetry(assignment.assignmentFile);

    // Step 2: Process extracted content via Gemini
    console.log('🔄 Processing content via Gemini...');
    const processedData = await processAssignmentContent(extractedContent);

    // Step 3: Store results
    assignment.extractedContent = extractedContent;
    assignment.processedData = processedData;
    assignment.processingStatus = 'completed';
    await assignment.save();

    console.log('✅ Assignment processing completed');
  } catch (error) {
    assignment.processingStatus = 'failed';
    assignment.error = error.message;
    await assignment.save();
  }
}
```

### 3.2 Rubric Processing

**File**: `server/workers/rubricProcessor.js`

```javascript
async function processRubric(job) {
  const { assignmentId } = job.data;
  const assignment = await Assignment.findById(assignmentId);

  // Step 1: Extract via Landing AI
  const extractedRubric = await extractWithRetry(assignment.rubricFile);

  // Step 2: Process via Gemini
  const processedRubric = await processRubricContent(extractedRubric);

  // Step 3: Store
  assignment.extractedRubric = extractedRubric;
  assignment.processedRubric = processedRubric;
  assignment.rubricProcessingStatus = 'completed';
  await assignment.save();
}
```

### 3.3 Solution Processing

**File**: `server/workers/solutionProcessor.js`

```javascript
async function processSolution(job) {
  const { assignmentId } = job.data;
  const assignment = await Assignment.findById(assignmentId);

  // Step 1: Extract via Landing AI
  const extractedSolution = await extractWithRetry(assignment.solutionFile);

  // Step 2: Process via Gemini
  const processedSolution = await processSolutionContent(extractedSolution);

  // Step 3: Store
  assignment.extractedSolution = extractedSolution;
  assignment.processedSolution = processedSolution;
  assignment.solutionProcessingStatus = 'completed';
  await assignment.save();
}
```

### 3.4 Submission Evaluation

**File**: `server/workers/evaluationProcessor.js`

```javascript
async function evaluateSubmission(job) {
  const { submissionId } = job.data;
  const submission = await Submission.findById(submissionId);
  const assignment = await Assignment.findById(submission.assignmentId);

  // Step 1: Extract student submission via Landing AI
  console.log('🔄 Extracting student submission...');
  const extractedSubmission = await extractWithRetry(submission.submissionFile);

  // Step 2: Prepare context (assignment info already stored)
  const evaluationContext = {
    assignmentContent: assignment.processedData,
    rubricContent: assignment.processedRubric,
    solutionContent: assignment.processedSolution,
    studentSubmission: extractedSubmission
  };

  // Step 3: Evaluate via Gemini
  console.log('🔄 Evaluating submission via Gemini...');
  const evaluationResult = await evaluateWithGemini(evaluationContext);

  // Step 4: Store results
  submission.extractedContent = extractedSubmission;
  submission.evaluationResult = evaluationResult;
  submission.evaluationStatus = 'completed';
  submission.overallGrade = evaluationResult.overallGrade;
  await submission.save();

  console.log('✅ Evaluation completed for student:', submission.studentName);
}
```

---

## 4. Updated Gemini Service

**File**: `server/utils/geminiService.js`

### New Functions (Text-based instead of PDF)

```javascript
/**
 * Process assignment content (from Landing AI extraction)
 */
async function processAssignmentContent(extractedContent) {
  const prompt = `
    Analyze this extracted assignment content and provide structured output:

    ${JSON.stringify(extractedContent)}

    Return JSON with:
    - title
    - description
    - questions (array with number, text, requirements, constraints)
    - total_points
  `;

  return await callGeminiAPI(prompt);
}

/**
 * Process rubric content (from Landing AI extraction)
 */
async function processRubricContent(extractedContent) {
  const prompt = `
    Analyze this extracted rubric and provide structured grading criteria:

    ${JSON.stringify(extractedContent)}

    Return JSON with grading_criteria array containing:
    - question_number
    - criterionName
    - weight
    - description
    - marking_scale
  `;

  return await callGeminiAPI(prompt);
}

/**
 * Process solution content (from Landing AI extraction)
 */
async function processSolutionContent(extractedContent) {
  const prompt = `
    Analyze this extracted model solution:

    ${JSON.stringify(extractedContent)}

    Return JSON with questions array containing:
    - questionNumber
    - solution
    - expectedOutput
    - keySteps
  `;

  return await callGeminiAPI(prompt);
}

/**
 * Evaluate student submission against assignment
 */
async function evaluateWithGemini(context) {
  const prompt = `
    Evaluate this student submission against the assignment criteria.

    ASSIGNMENT:
    ${JSON.stringify(context.assignmentContent)}

    RUBRIC:
    ${JSON.stringify(context.rubricContent)}

    MODEL SOLUTION:
    ${JSON.stringify(context.solutionContent)}

    STUDENT SUBMISSION:
    ${JSON.stringify(context.studentSubmission)}

    Provide detailed evaluation with:
    - overallGrade (number)
    - totalPossible (number)
    - criteriaGrades (array with scores and feedback)
    - questionScores (array with subsections)
    - strengths (array, min 3)
    - areasForImprovement (array, min 2)
    - suggestions (array, min 2)
  `;

  return await callGeminiAPI(prompt);
}

/**
 * Call Gemini API with text prompt (no PDF)
 */
async function callGeminiAPI(prompt) {
  await enforceRateLimit();

  const result = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 65536,
      responseMimeType: "application/json"
    }
  });

  const responseText = result.response.text();
  return JSON.parse(cleanJsonResponse(responseText));
}
```

---

## 5. Database Schema Updates

### Assignment Model

**File**: `server/models/assignment.js`

```javascript
// Add new fields for extracted content
const assignmentSchema = new mongoose.Schema({
  // Existing fields...

  // New: Raw extracted content from Landing AI
  extractedContent: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  extractedRubric: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  extractedSolution: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Existing: Processed data from Gemini
  processedData: mongoose.Schema.Types.Mixed,
  processedRubric: mongoose.Schema.Types.Mixed,
  processedSolution: mongoose.Schema.Types.Mixed,
});
```

### Submission Model

**File**: `server/models/submission.js`

```javascript
// Add new field for extracted content
const submissionSchema = new mongoose.Schema({
  // Existing fields...

  // New: Raw extracted content from Landing AI
  extractedContent: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Existing: Evaluation result from Gemini
  evaluationResult: mongoose.Schema.Types.Mixed,
});
```

---

## 6. Rate Limiting Strategy

### Two APIs to Manage

| API | Rate Limit | Strategy |
|-----|------------|----------|
| Landing AI | Check docs | Queue with delay |
| Gemini | 5 RPM | 12s interval |

### Sequential Processing

```javascript
// For each document:
// 1. Landing AI call (extract)
// 2. Wait for Landing AI rate limit
// 3. Gemini call (process)
// 4. Wait for Gemini rate limit (12s)

const LANDING_AI_DELAY = 2000;  // 2 seconds between calls
const GEMINI_DELAY = 12000;     // 12 seconds between calls
```

### Throughput Estimates (Updated)

| Scenario | API Calls | Est. Time |
|----------|-----------|-----------|
| 1 Assignment (3 PDFs) | 3 Landing + 3 Gemini | ~45 sec |
| 1 Assignment + 10 Submissions | 13 Landing + 13 Gemini | ~4 min |
| 1 Assignment + 30 Submissions | 33 Landing + 33 Gemini | ~10 min |

---

## 7. Implementation Phases

### Phase 1: Core Integration (Week 1-2)

1. **Create `landingAIService.js`**
   - PDF extraction function
   - Retry logic
   - Error handling

2. **Update workers to use two-stage processing**
   - `assignmentProcessor.js`
   - `rubricProcessor.js`
   - `solutionProcessor.js`
   - `evaluationProcessor.js`

3. **Update `geminiService.js`**
   - New text-based processing functions
   - Remove PDF handling (use extracted content)

4. **Update database schemas**
   - Add `extractedContent` fields

### Phase 2: Optimization (Week 3-4)

5. **Rate limiting for both APIs**
   - Dual queue system
   - Priority management

6. **Caching extracted content**
   - Avoid re-extraction for re-runs

7. **Error handling improvements**
   - Categorize Landing AI vs Gemini errors
   - Appropriate retry strategies

### Phase 3: Monitoring (Week 5)

8. **Usage tracking**
   - Landing AI API calls
   - Gemini token usage

9. **Progress reporting**
   - Show extraction vs processing stages in UI

---

## 8. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `server/utils/landingAIService.js` | Landing AI integration |

### Modified Files

| File | Changes |
|------|---------|
| `server/utils/geminiService.js` | Text-based processing (no PDF) |
| `server/workers/assignmentProcessor.js` | Two-stage processing |
| `server/workers/rubricProcessor.js` | Two-stage processing |
| `server/workers/solutionProcessor.js` | Two-stage processing |
| `server/workers/evaluationProcessor.js` | Two-stage processing |
| `server/models/assignment.js` | Add extractedContent fields |
| `server/models/submission.js` | Add extractedContent field |

---

## 9. Environment Configuration

```env
# server/.env

# Existing
MONGO_URI=mongodb://localhost:27017/edugrade
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-pro
PORT=5000

# New
LANDING_AI_API_KEY=your_landing_ai_api_key
LANDING_AI_MODEL=dpt-2-latest
```

---

## 10. Benefits of Two-Stage Approach

| Benefit | Description |
|---------|-------------|
| Better Extraction | Landing AI specialized for document parsing |
| Structured Data | Clean text/tables passed to Gemini |
| Reduced Tokens | No PDF encoding in Gemini context |
| Separation of Concerns | Extraction vs Processing |
| Debugging | Can inspect extracted content separately |
| Reusability | Extracted content cached for re-evaluation |

---

## 11. Testing Strategy

### Unit Tests

- Landing AI service mock responses
- Gemini text processing validation
- Error handling for both APIs

### Integration Tests

```javascript
// Test full pipeline
describe('Two-Stage Processing', () => {
  it('should extract and process assignment', async () => {
    // 1. Upload PDF
    // 2. Verify Landing AI extraction
    // 3. Verify Gemini processing
    // 4. Check stored results
  });

  it('should evaluate submission with stored assignment', async () => {
    // 1. Create assignment (store processed data)
    // 2. Upload submission
    // 3. Verify extraction
    // 4. Verify evaluation uses stored assignment
  });
});
```

---

## 12. Error Handling

### Landing AI Errors

```javascript
const LandingAIErrors = {
  RATE_LIMIT: 'rate_limit_exceeded',
  INVALID_PDF: 'invalid_document',
  TIMEOUT: 'extraction_timeout',
  AUTH: 'authentication_failed'
};

async function handleLandingAIError(error, pdfPath) {
  if (error.response?.status === 429) {
    // Wait and retry
    await sleep(5000);
    return extractWithRetry(pdfPath);
  }
  if (error.response?.status === 400) {
    throw new Error('Invalid PDF format');
  }
  throw error;
}
```

### Gemini Errors

```javascript
// Existing error handling applies
// Now only handles text processing errors
// No PDF-related errors
```

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Extraction Success Rate | >98% |
| Processing Success Rate | >95% |
| End-to-End Success | >93% |
| Avg Extraction Time | <5s per PDF |
| Avg Processing Time | <10s per document |
| Avg Evaluation Time | <15s per submission |

---

## 14. Timeline Summary

| Week | Deliverables |
|------|--------------|
| 1 | Landing AI service, schema updates |
| 2 | Worker updates for two-stage processing |
| 3 | Rate limiting, caching |
| 4 | Error handling, monitoring |
| 5 | Testing, documentation |

---

*End of Plan*
