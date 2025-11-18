# Re-run Orchestration Feature Guide

## Overview

Added functionality to **re-run orchestration** when issues or warnings are detected, allowing instructors to attempt to fix validation problems by re-reading files or re-analyzing the document structure.

---

## Why Re-run Orchestration?

### Use Cases

**1. Initial Validation Found Issues**
```
Orchestration completed successfully
Validation status: HAS ISSUES
Completeness score: 75%
Total issues found: 2
Recommendations: 2
```

Issues might include:
- Missing rubric criteria for some questions
- Question numbering inconsistencies
- Incomplete solution coverage
- Point allocation mismatches

**2. File Reading Errors**
- PDF extraction may have failed partially
- Complex formatting caused parsing issues
- Some content was missed in initial processing

**3. Improve Validation Quality**
- Force a fresh re-reading of all PDFs
- Get updated analysis with potentially better extraction
- Try to resolve detected inconsistencies

---

## How It Works

### Backend Implementation

#### 1. **New API Endpoint** (`routes/assignments.js`)

```javascript
POST /api/assignments/:id/rerun-orchestration

Body (optional):
{
  "forceReread": true  // Force re-reading PDFs from disk
}

Response:
{
  "message": "Orchestration re-run initiated successfully",
  "assignmentId": "...",
  "forceReread": true
}
```

#### 2. **Controller Function** (`assignmentController.js`)

```javascript
exports.rerunOrchestration = async (req, res) => {
  // 1. Verify assignment exists and is fully processed
  // 2. Reset orchestration status to 'pending'
  // 3. Clear previous orchestration errors
  // 4. Queue new orchestration job with forceReread flag
  // 5. Return success response
}
```

**Validations:**
- Assignment must exist
- Assignment must be fully processed (status = 'completed')
- Cannot re-run if documents aren't ready

#### 3. **Enhanced Orchestration Processor** (`orchestrationProcessor.js`)

```javascript
const { assignmentId, forceReread } = job.data;

// If forceReread = true, pass null data to force file re-reading
const assignmentDataToUse = forceReread ? null : assignment.processedData;
const rubricDataToUse = forceReread ? null : assignment.processedRubric;
const solutionDataToUse = forceReread ? null : assignment.processedSolution;

// Orchestration function will re-read files when data is null
await orchestrateAssignmentData(
  assignmentDataToUse,
  rubricDataToUse,
  solutionDataToUse,
  filePaths  // Always pass file paths for re-reading
);
```

**Two Modes:**

1. **Normal Re-run** (`forceReread: false`)
   - Uses existing processed data
   - Re-reads files only if data seems incomplete
   - Faster, less resource-intensive

2. **Force Re-read** (`forceReread: true`)
   - Passes null data to orchestration
   - Forces complete file re-reading
   - Slower, but may catch previously missed content

---

### Frontend Implementation

#### 1. **Re-run Button UI** (`AssignmentProcessingPage.js`)

**Location:** Bottom of orchestration card (when completed)

**Visual Design:**
```
┌────────────────────────────────────────────────────────┐
│ Re-run Validation                                      │
├────────────────────────────────────────────────────────┤
│ Issues were found. Re-running orchestration may help   │
│ improve validation by re-reading files.                │
│                                                         │
│ [ ] Force re-read files    [🔄 Re-run Orchestration]  │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Only visible when orchestration is `completed`
- Checkbox to enable "Force re-read files"
- Button shows spinner during re-run
- Button variant changes based on issues:
  - `warning` (yellow) if issues detected
  - `outline-primary` (blue) if no issues

#### 2. **State Management**

```javascript
const [rerunningOrchestration, setRerunningOrchestration] = useState(false);
const [forceReread, setForceReread] = useState(false);

const handleRerunOrchestration = async () => {
  // 1. Set loading state
  // 2. Call API endpoint
  // 3. Restart polling if stopped
  // 4. Handle errors
};
```

#### 3. **Automatic Polling Resume**

When re-running orchestration:
```javascript
// Reset polling to track the new orchestration run
if (!pollingIntervalRef.current) {
  const intervalId = setInterval(checkStatus, 2000);
  pollingIntervalRef.current = intervalId;
}
```

This ensures the UI automatically updates as the new orchestration runs.

---

## User Flow

### Scenario: Fixing Validation Issues

**1. Initial State**
```
User creates assignment → Processing completes
↓
Orchestration runs automatically
↓
Result: 75% completeness, 2 issues found
```

**UI Shows:**
```
Orchestration & Validation
✅ Validation Completed

Completeness Score: 75% [███████████░░░░░]

⚠   2      2
Valid Issues Tips

⚠️ Some issues were detected during validation.

─────────────────────────────────────────
Re-run Validation
Issues were found. Re-running orchestration may help...

[ ] Force re-read files    [🔄 Re-run Orchestration]
```

**2. User Actions**

**Option A: Quick Re-run** (without force re-read)
```
1. Click "Re-run Orchestration"
2. Button shows "Re-running..."
3. Orchestration card updates to "Validating Documents"
4. Wait ~10-15 seconds
5. New results appear
```

**Option B: Force Re-read** (if first attempt didn't help)
```
1. Check "Force re-read files" checkbox
2. Click "Re-run Orchestration"
3. System re-reads all PDFs from disk
4. Longer processing time (~30-60 seconds)
5. Potentially better extraction results
```

**3. Improved Results**
```
Orchestration completes again
↓
New Result: 90% completeness, 0 issues! ✅
```

---

## When to Use Each Mode

### Normal Re-run (forceReread: false)

**Use when:**
- Validation logic might have improved
- Minor inconsistencies detected
- Quick retry desired
- Files haven't changed

**Advantages:**
- Fast (uses cached data)
- Less resource intensive
- Quick validation refresh

**Example:**
```
Issue: "Question 3 has no rubric criteria"
Action: Normal re-run
Reason: Orchestrator might map it better on second analysis
```

### Force Re-read (forceReread: true)

**Use when:**
- Normal re-run didn't help
- Suspect PDF extraction failed
- File might have complex formatting
- Want comprehensive re-analysis

**Advantages:**
- Fresh file extraction
- May catch previously missed content
- Comprehensive re-processing

**Example:**
```
Issue: "Missing rubric criteria for questions 2, 3, 4"
Action: Force re-read
Reason: PDF might have been poorly extracted initially
```

---

## API Behavior

### Success Response
```json
{
  "message": "Orchestration re-run initiated successfully",
  "assignmentId": "6907404466dbdc50edd7e185",
  "forceReread": true
}
```

### Error Responses

**1. Assignment Not Found**
```json
{
  "error": "Assignment not found"
}
// Status: 404
```

**2. Processing Not Complete**
```json
{
  "error": "Assignment must be fully processed before re-running orchestration",
  "currentStatus": "processing"
}
// Status: 400
```

**3. Server Error**
```json
{
  "error": "An error occurred while re-running orchestration",
  "details": "Connection timeout"
}
// Status: 500
```

---

## Database Changes

### Before Re-run
```javascript
{
  orchestrationStatus: 'completed',
  orchestrationCompletedAt: ISODate("2025-11-02T10:30:00Z"),
  orchestratedData: { /* previous results */ },
  validationResults: { /* previous issues */ }
}
```

### During Re-run
```javascript
{
  orchestrationStatus: 'pending',  // Reset
  orchestrationStartedAt: null,     // Cleared
  orchestrationCompletedAt: null,   // Cleared
  orchestrationError: null,         // Cleared
  orchestratedData: { /* old data still present */ },
  validationResults: { /* old data still present */ }
}
```

### After Re-run
```javascript
{
  orchestrationStatus: 'completed',
  orchestrationStartedAt: ISODate("2025-11-02T10:45:00Z"),
  orchestrationCompletedAt: ISODate("2025-11-02T10:45:15Z"),
  orchestratedData: { /* new results */ },
  validationResults: { /* new issues/none */ }
}
```

---

## Logging

### Backend Logs

**Controller:**
```
Re-running orchestration for assignment 6907404466dbdc50edd7e185
Force re-read files: true
Orchestration status reset to pending
Orchestration job queued
```

**Processor:**
```
Processing orchestration job 1762083500000abc123
Starting orchestration for assignment 6907404466dbdc50edd7e185
  - Force re-read files: YES
  - Assignment data: Available
  - Rubric data: Available
  - Solution data: Not provided

⚠️  Force re-read enabled: Will re-read all files from disk

Re-reading assignment file for better data...
Assignment re-read successful

Re-reading rubric file for better data...
Rubric re-read successful

Orchestration completed successfully
Validation status: VALID ✅
Completeness score: 90%
Total issues found: 0
```

---

## Edge Cases Handled

### 1. **Re-run While Processing**
```javascript
// Check in controller prevents this
if (assignment.processingStatus !== 'completed') {
  return res.status(400).json({ error: '...' });
}
```

### 2. **Multiple Simultaneous Re-runs**
- Status reset to 'pending' prevents double-queueing
- Queue system handles one job at a time
- UI button disabled while `rerunningOrchestration === true`

### 3. **Polling Stopped**
```javascript
// Automatically restart polling when re-running
if (!pollingIntervalRef.current) {
  pollingIntervalRef.current = setInterval(...);
}
```

### 4. **Files Missing**
```javascript
// Orchestrator handles gracefully
if (!filePaths.assignmentPath) {
  console.warn('Assignment file path not available');
  // Uses existing processed data
}
```

---

## Testing Checklist

✅ **Verify These Behaviors:**

1. **UI Display**
   - [ ] Re-run button appears when orchestration completes
   - [ ] Checkbox for "Force re-read files" works
   - [ ] Button text changes based on issues count
   - [ ] Button disables during re-run
   - [ ] Spinner shows while re-running

2. **Normal Re-run**
   - [ ] Click button (without checkbox)
   - [ ] Orchestration status changes to "processing"
   - [ ] Polling resumes if stopped
   - [ ] New results appear after ~10-15 seconds
   - [ ] Completeness score updates

3. **Force Re-read**
   - [ ] Check "Force re-read files"
   - [ ] Click button
   - [ ] Backend logs show "Force re-read enabled"
   - [ ] Files are re-read from disk
   - [ ] Processing takes longer (~30-60 seconds)
   - [ ] Results may differ from first run

4. **Error Handling**
   - [ ] Shows error if API call fails
   - [ ] Button re-enables after error
   - [ ] Polling doesn't break on error

5. **Completeness Improvement**
   - [ ] Re-run can improve completeness score
   - [ ] Issues count can decrease
   - [ ] Validation status can change to VALID

---

## Performance Considerations

| Mode | Time | Resources | Use Case |
|------|------|-----------|----------|
| Normal Re-run | ~10-15s | Low (cached data) | Quick retry |
| Force Re-read | ~30-60s | Medium (file I/O + AI) | Deep analysis |

**Recommendation:** Start with normal re-run, escalate to force re-read if issues persist.

---

## Summary

✅ **New endpoint:** `/api/assignments/:id/rerun-orchestration`  
✅ **UI button:** Re-run orchestration from processing page  
✅ **Two modes:** Normal (fast) vs Force re-read (thorough)  
✅ **Auto-polling:** Resumes automatically during re-run  
✅ **Issue-aware:** Button highlights when issues detected  
✅ **Smart re-reading:** Only re-reads files when needed or forced  

**Instructors can now iteratively improve orchestration results to achieve higher validation completeness and fewer issues!** 🎉
