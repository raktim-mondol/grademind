# Orchestration UI Implementation Guide

## Overview

The UI has been enhanced to display orchestration processing status and validation results, providing instructors with real-time visibility into the quality and completeness of their assignment setup.

---

## What Was Added to the UI

### 1. **Enhanced API Response** (`server/controllers/assignmentController.js`)

The `/api/assignments/:id/status` endpoint now returns:

```javascript
{
  // Existing fields
  assignmentProcessingStatus: 'completed',
  rubricProcessingStatus: 'completed',
  solutionProcessingStatus: 'completed',
  
  // NEW: Orchestration status
  orchestrationStatus: 'completed', // 'not_started' | 'processing' | 'completed' | 'failed'
  orchestrationError: null,
  
  // NEW: Orchestration summary data
  orchestrationData: {
    completenessScore: 85,           // 0-100%
    isValid: true,                    // Overall validation status
    hasWarnings: true,                // Has non-critical issues
    issuesCount: 2,                   // Number of issues found
    recommendationsCount: 3           // Number of recommendations
  },
  
  // NEW: Detailed validation results
  validationResults: {
    hasIssues: true,
    missingRubricForQuestions: [],
    extraRubricCriteria: [],
    missingSolutionForQuestions: ['4'],
    inconsistentQuestionNumbers: [],
    warnings: [...],
    suggestions: [...]
  }
}
```

---

### 2. **Assignment Processing Page** (`client/src/pages/AssignmentProcessingPage.js`)

#### Added Orchestration Section

A new card appears below the Assignment/Rubric/Solution cards when orchestration is running or completed:

**Features:**
- **Status Indicator**: Shows processing/completed/failed status with icons
- **Completeness Score**: Large progress bar showing validation completeness (0-100%)
- **Quality Metrics**:
  - ✓ Valid indicator (green checkmark or warning symbol)
  - Issues count (number of problems detected)
  - Tips count (number of recommendations)
- **Warning Alerts**: Shows if issues were detected but grading will still work
- **Visual Feedback**: Color-coded based on completeness score:
  - Green (≥80%): Excellent
  - Yellow (60-79%): Good
  - Red (<60%): Needs attention

#### Example Display:

```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Orchestration & Validation                        ⚠️ Enhanced Quality │
│ Integrating assignment, rubric, and solution for optimal grading        │
├─────────────────────────────────────────────────────────────┤
│ ✓ Validation Completed                                      │
│                                                              │
│ Completeness Score: 85% [████████████████░░░░]             │
│                                                              │
│    ✓        2        3                                      │
│   Valid   Issues   Tips                                     │
│                                                              │
│ ⚠️ Some issues were detected during validation. The system   │
│   will still grade submissions, but you may want to review   │
│   the assignment structure.                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Updated Progress Bar

The overall progress bar now includes orchestration:
- If orchestration runs, it counts as an additional step
- Progress = (completed items) / (total applicable items including orchestration)

#### Updated Help Section

Added information about orchestration:
> "Orchestration & Validation runs after all documents are processed. It validates consistency, creates integrated mappings, and ensures optimal grading accuracy."

---

### 3. **Assignment List Page** (`client/src/pages/AssignmentList.js`)

#### Enhanced Status Badges

When orchestration is completed, assignment cards now show a secondary badge:

```
┌────────────────────────────┐
│ Assignment Title           │
│ Course Code        ✓ Ready │
│                  85% Validated │  ← NEW!
├────────────────────────────┤
│ ...                        │
└────────────────────────────┘
```

**Badge Colors:**
- Green: ≥80% completeness (excellent)
- Yellow: 60-79% completeness (good)
- Gray: <60% completeness (needs review)

**Tooltip:** Hover shows "Orchestration completeness score"

---

## Visual Flow

### Timeline of Status Updates

```
1. Assignment Upload
   ├─ Assignment: ⏳ Pending → 🔄 Processing → ✅ Completed
   ├─ Rubric: ⏳ Pending → 🔄 Processing → ✅ Completed
   └─ Solution: ⏳ Pending → 🔄 Processing → ✅ Completed

2. Orchestration Triggered (after all complete)
   └─ Orchestration: 🔄 Processing → ✅ Completed (85%)
       ├─ Completeness: 85%
       ├─ Issues: 2
       └─ Recommendations: 3

3. Ready for Submissions ✅
```

---

## User Experience Enhancements

### Before Implementation
- Users only saw if documents were processed
- No visibility into data quality
- No feedback on consistency issues
- No indication if grading would be optimal

### After Implementation
- **Real-time orchestration status** during processing
- **Quality score** (completeness %) visible immediately
- **Issue awareness** without blocking workflow
- **Visual feedback** on assignment setup quality
- **Secondary badge** in list view for quick quality check

---

## Responsive Polling

The `AssignmentProcessingPage` polls every 2 seconds and:
1. Checks if orchestration has started
2. Shows orchestration card when status changes from `not_started`
3. Updates completeness score in real-time
4. Displays issues/recommendations when completed
5. Stops polling when all processing (including orchestration) is done

---

## Color Coding Guide

### Completeness Score Colors

| Score | Color | Badge | Meaning |
|-------|-------|-------|---------|
| ≥80% | Green (`success`) | 85% Validated | Excellent - All mappings clear |
| 60-79% | Yellow (`warning`) | 65% Validated | Good - Minor issues present |
| <60% | Red (`danger`) or Gray (`secondary`) | 45% Validated | Needs attention |

### Status Icons

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| `processing` | Spinner | Yellow | Currently validating |
| `completed` | ✓ CheckCircle | Green | Validation complete |
| `failed` | ✗ AlertCircle | Red | Validation failed |
| `not_started` | - | - | Not shown |

---

## API Integration

### Frontend Fetches

```javascript
// In AssignmentProcessingPage.js
const checkProcessingStatus = async () => {
  const { data } = await axios.get(`/api/assignments/${id}/status`);
  
  // Now includes orchestrationStatus and orchestrationData
  setProcessingStatus(data);
};
```

### Data Flow

```
Backend                          Frontend
─────────                        ────────
Assignment Model                 AssignmentProcessingPage
  ├─ orchestrationStatus    →      ├─ Shows orchestration card
  ├─ orchestratedData       →      ├─ Displays completeness score
  │   ├─ validation         →      ├─ Shows issues count
  │   │   ├─ completeness   →      ├─ Progress bar
  │   │   ├─ isValid        →      ├─ Valid/Warning icon
  │   │   └─ issues         →      └─ Warning alerts
  │   └─ recommendations    →
  └─ validationResults      →
```

---

## Edge Cases Handled

### 1. No Orchestration
If orchestration hasn't started (`not_started`), the section is hidden:
```javascript
{processingStatus.orchestrationStatus && 
 processingStatus.orchestrationStatus !== 'not_started' && (
  // Orchestration card
)}
```

### 2. Orchestration Failed
Shows error message and allows evaluation to proceed:
```javascript
{processingStatus.orchestrationError && (
  <Alert variant="danger">
    {processingStatus.orchestrationError}
  </Alert>
)}
```

### 3. Partial Data
If some documents are missing, orchestration still runs:
- Adjusts completeness score based on available documents
- Shows which mappings are missing
- Provides recommendations

### 4. Progress Calculation
Only counts orchestration in progress if it has started:
```javascript
const total = 1 + 
  (rubric !== 'not_applicable' ? 1 : 0) +
  (solution !== 'not_applicable' ? 1 : 0) +
  (orchestration !== 'not_started' ? 1 : 0);  // Conditional
```

---

## Testing Checklist

### ✅ Verify These Behaviors

1. **Processing Page**
   - [ ] Orchestration card appears after documents are processed
   - [ ] Completeness score updates in real-time
   - [ ] Progress bar includes orchestration step
   - [ ] Issues and recommendations display correctly
   - [ ] Warning alert shows when hasWarnings is true
   - [ ] Color coding matches score ranges

2. **List Page**
   - [ ] Validation badge appears on ready/partial assignments
   - [ ] Badge color matches completeness score
   - [ ] Tooltip shows on hover
   - [ ] Badge doesn't appear if no orchestration data

3. **API Response**
   - [ ] /status endpoint returns orchestration fields
   - [ ] orchestrationData is null before completion
   - [ ] validationResults populated after orchestration

4. **Error Handling**
   - [ ] Orchestration failure doesn't block evaluation
   - [ ] Error messages display clearly
   - [ ] Polling stops gracefully on completion

---

## Future Enhancements

Potential UI improvements:

### 1. Detailed Validation View
Add a modal or expandable section showing:
- Full list of issues with severity levels
- Specific recommendations
- Question-by-question mapping status

### 2. Interactive Validation
Allow instructors to:
- Confirm or override mappings
- Mark issues as "acknowledged"
- Request re-orchestration

### 3. Quality Trends
Show orchestration scores across multiple assignments:
- Average completeness score
- Common issues across assignments
- Quality improvement over time

### 4. Real-time Notifications
Browser notifications when:
- Orchestration completes
- Critical issues are found
- Assignment is fully ready

---

## Styling Notes

### Custom CSS Classes Used

```css
.status-card {
  /* Existing card styling */
}

.status-completed {
  /* Green accent for completed items */
}

.status-processing {
  /* Yellow accent for processing */
}

.status-failed {
  /* Red accent for failures */
}
```

### Responsive Design

- Desktop (lg): Full orchestration card with all metrics
- Tablet (md): Stacked metrics
- Mobile (sm): Simplified view with essential info only

---

## Summary

The UI now provides **complete visibility** into orchestration:

✅ **Real-time status updates** during validation  
✅ **Quality metrics** with visual indicators  
✅ **Issue awareness** without blocking workflow  
✅ **Quick quality check** in assignment list  
✅ **Smooth user experience** with progressive disclosure  

**Instructors can now:**
- See exactly when orchestration is running
- Understand the quality of their assignment setup
- Identify issues before students submit
- Make informed decisions about assignment readiness
- Track validation scores across assignments

The orchestration feature is now a **visible, valuable part** of the assignment creation workflow! 🎉
