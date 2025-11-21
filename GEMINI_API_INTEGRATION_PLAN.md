# Gemini API Integration Plan for EduGrade

**Date**: 2025-11-21
**Branch**: `claude/plan-gemini-api-integration-019i8qR4fHBcrtQs7Rw5Lwfe`

---

## Executive Summary

This document outlines the implementation plan for enhancing the Gemini API integration in EduGrade, leveraging `gemini-2.5-pro` capabilities for direct PDF processing.

---

## 1. Current State

### Existing Implementation

**File**: `server/utils/geminiService.js`

| Feature | Status |
|---------|--------|
| Direct PDF Processing | ✅ Working |
| Rate Limiting (12s/5 RPM) | ✅ Working |
| Request Queue (FIFO) | ✅ Working |
| Retry with Backoff | ✅ Working |
| JSON Response Mode | ✅ Working |

### API Call Configuration

```javascript
generationConfig: {
  temperature: 0.1,          // For extraction tasks
  maxOutputTokens: 65536,
  responseMimeType: "application/json"
}
```

### PDF Processing Pattern

```javascript
const contents = [
  {
    parts: [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data
        }
      }
    ]
  }
];
```

---

## 2. Worker-Specific API Calls

### 2.1 Assignment Processing

**File**: `server/workers/assignmentProcessor.js`

| Function | Purpose | Output |
|----------|---------|--------|
| `processAssignmentPDF()` | Extract structure | Questions, requirements |
| `extractRubricFromAssignmentPDF()` | Extract embedded rubric | Grading criteria |

### 2.2 Rubric Processing

**File**: `server/workers/rubricProcessor.js`

| Function | Purpose | Output |
|----------|---------|--------|
| `processRubricPDF()` | Extract criteria | Weights, marking scales |

### 2.3 Solution Processing

**File**: `server/workers/solutionProcessor.js`

| Function | Purpose | Output |
|----------|---------|--------|
| `processSolutionPDF()` | Extract model solution | Steps, expected outputs |

### 2.4 Evaluation Processing

**File**: `server/workers/evaluationProcessor.js`

| Function | Purpose | Output |
|----------|---------|--------|
| `evaluateSubmission()` | Grade submission | Scores, feedback, suggestions |

**Configuration**: `temperature: 0.2` (slightly higher for feedback variety)

### 2.5 Orchestration Processing

**File**: `server/workers/orchestrationProcessor.js`

| Function | Purpose | Output |
|----------|---------|--------|
| `orchestrateAssignmentData()` | Validate consistency | Issues, recommendations |

---

## 3. Implementation Phases

### Phase 1: Stability Improvements (High Priority)

#### 1.1 Response Validation Enhancement

**File**: `server/utils/geminiService.js`

```javascript
// Add comprehensive validation
const evaluationSchema = {
  overallGrade: { type: 'number', required: true },
  criteriaGrades: { type: 'array', required: true, minLength: 1 },
  strengths: { type: 'array', required: true, minLength: 3 },
  areasForImprovement: { type: 'array', required: true, minLength: 2 }
};

function validateResponse(response, schema) {
  const errors = [];
  // Validate all fields...
  return { valid: errors.length === 0, errors };
}
```

#### 1.2 Question Coverage Enforcement

**File**: `server/workers/evaluationProcessor.js`

- Convert warning to error when questions are missing
- Auto-retry with explicit instruction to cover missing questions

#### 1.3 Score Consistency Check

```javascript
// Ensure sum matches total
const scoreSum = criteriaGrades.reduce((sum, cg) => sum + cg.score, 0);
if (Math.abs(scoreSum - overallGrade) > 0.01) {
  // Retry with correction instruction
}
```

### Phase 2: Performance Optimization (Medium Priority)

#### 2.1 Token Usage Tracking

**File**: `server/utils/geminiService.js`

```javascript
// Track usage per request
const usageStats = {
  inputTokens: 0,
  outputTokens: 0,
  requestCount: 0
};

async function callGeminiAPI(prompt, pdfPath) {
  const response = await model.generateContent(...);
  usageStats.inputTokens += response.usageMetadata.promptTokenCount;
  usageStats.outputTokens += response.usageMetadata.candidatesTokenCount;
  return response;
}
```

#### 2.2 Caching Layer

```javascript
// Cache processed documents
const documentCache = new Map();

async function getProcessedAssignment(assignmentId) {
  if (documentCache.has(assignmentId)) {
    return documentCache.get(assignmentId);
  }
  const result = await processAssignmentPDF(pdfPath);
  documentCache.set(assignmentId, result);
  return result;
}
```

#### 2.3 Priority Queue

**File**: `server/config/memoryQueue.js`

```javascript
const priorityQueue = {
  high: [],   // Evaluations
  medium: [], // Document processing
  low: []     // Orchestration
};

function addToQueue(job, priority = 'medium') {
  priorityQueue[priority].push(job);
  processNextJob();
}
```

### Phase 3: Scalability (Lower Priority)

#### 3.1 Batch Evaluation Mode

- Process multiple submissions in a single API call
- Share assignment context across batch

#### 3.2 WebSocket Progress Updates

**New File**: `server/websocket/progressHandler.js`

```javascript
// Real-time progress to frontend
io.emit('evaluation-progress', {
  submissionId,
  status: 'processing',
  progress: 50
});
```

#### 3.3 Multi-Model Fallback

```javascript
const models = [
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

async function callWithFallback(prompt, pdfPath) {
  for (const modelName of models) {
    try {
      return await callGeminiAPI(prompt, pdfPath, modelName);
    } catch (error) {
      if (error.status === 429) continue; // Try next model
      throw error;
    }
  }
}
```

---

## 4. Rate Limiting Strategy

### Current Implementation

```javascript
const MIN_REQUEST_INTERVAL = 12000; // 12 seconds
```

### Throughput Estimates

| Scenario | Requests | Time |
|----------|----------|------|
| 1 Assignment (with rubric + solution) | 3 | 36 sec |
| 1 Assignment + 10 Submissions | 13 | 2.6 min |
| 1 Assignment + 30 Submissions | 33 | 6.6 min |
| 10 Assignments + 100 Submissions each | 1,030 | 3.4 hrs |

### Recommended: Sliding Window

```javascript
const requestTimestamps = [];
const WINDOW_SIZE = 60000;
const MAX_REQUESTS = 5;

async function enforceRateLimit() {
  const now = Date.now();
  // Remove old timestamps
  while (requestTimestamps[0] < now - WINDOW_SIZE) {
    requestTimestamps.shift();
  }
  // Wait if at limit
  if (requestTimestamps.length >= MAX_REQUESTS) {
    await sleep(requestTimestamps[0] + WINDOW_SIZE - now);
  }
  requestTimestamps.push(now);
}
```

---

## 5. Error Handling Improvements

### Error Categories

```javascript
const ErrorTypes = {
  RATE_LIMIT: 429,
  INVALID_RESPONSE: 'parse_error',
  TRUNCATED: 'incomplete_json',
  SAFETY_BLOCK: 'content_blocked',
  TIMEOUT: 'timeout',
  NETWORK: 'network_error'
};
```

### Graceful Degradation

```javascript
function getPartialResult(error, context) {
  return {
    overallGrade: null,
    evaluationError: error.message,
    requiresManualReview: true,
    strengths: ["Automated evaluation failed"],
    suggestions: ["Contact instructor for manual evaluation"]
  };
}
```

---

## 6. Frontend-Backend Connection

### Polling Pattern

```javascript
// client/src/pages/AssignmentProcessingPage.js
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await axios.get(`/api/assignments/${id}/status`);

    const complete =
      data.assignmentProcessingStatus === 'completed' &&
      ['completed', 'not_applicable'].includes(data.rubricProcessingStatus) &&
      ['completed', 'not_applicable'].includes(data.solutionProcessingStatus);

    if (complete) clearInterval(interval);
  }, 30000);

  return () => clearInterval(interval);
}, [id]);
```

### API Endpoints Triggering Gemini

| Endpoint | Gemini Calls |
|----------|-------------|
| POST `/api/assignments` | 2-3 |
| POST `/api/assignments/:id/rerun-orchestration` | 1 |
| POST `/api/submissions/single` | 1-2 |
| POST `/api/submissions/:id/rerun` | 1 |

---

## 7. Files to Modify

### Core Changes

| File | Changes |
|------|---------|
| `server/utils/geminiService.js` | Validation, caching, token tracking |
| `server/workers/evaluationProcessor.js` | Question coverage enforcement |
| `server/config/memoryQueue.js` | Priority queue support |

### New Files (Phase 3)

| File | Purpose |
|------|---------|
| `server/websocket/progressHandler.js` | Real-time updates |
| `server/utils/tokenTracker.js` | Usage monitoring |

---

## 8. Testing Strategy

### Unit Tests

- Response validation with various malformed inputs
- Rate limiter behavior under load
- Cache hit/miss scenarios

### Integration Tests

- Full pipeline: Upload → Process → Evaluate
- Retry behavior on API errors
- Multi-model fallback

### Load Tests

- Batch submission processing
- Concurrent user uploads
- Rate limit compliance verification

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Evaluation Success Rate | >95% |
| Question Coverage | 100% |
| Avg Evaluation Time | <15s per submission |
| API Error Recovery | >90% |
| Score Consistency | 100% match |

---

## 10. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 1-2 weeks | Stability improvements |
| Phase 2 | 2-3 weeks | Performance optimization |
| Phase 3 | 3-4 weeks | Scalability features |

---

## Appendix: Gemini 2.5 Pro Capabilities

- **1M Token Context**: Process large documents whole
- **Direct PDF Processing**: No text extraction needed
- **JSON Response Mode**: Structured output guaranteed
- **Vision**: Analyze charts, diagrams, handwriting
- **Extended Output**: Up to 65,536 tokens

---

*End of Plan*
