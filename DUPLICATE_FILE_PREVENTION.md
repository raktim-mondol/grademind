# Duplicate File Prevention Feature

**Last Updated**: 2025-12-16  
**Feature**: Prevent uploading submission files with duplicate filenames

---

## Overview

This feature prevents users from uploading submission files that have the same filename as already evaluated submissions for the same assignment. Users must delete the previous submission before uploading a new file with the same name.

## Motivation

- **Data Integrity**: Prevents accidental overwriting of graded submissions
- **Clear Intent**: Forces users to explicitly delete old submissions before replacing them
- **Audit Trail**: Maintains clear records of which submissions have been evaluated
- **User Experience**: Provides clear feedback when duplicate files are detected

---

## Implementation Details

### Backend Changes

#### 1. Submission Model Update (`server/models/submission.js`)

Added a new field to track original filenames:

```javascript
originalFileName: {
  type: String,
  trim: true
  // Stores the original filename for duplicate detection
}
```

#### 2. Single Submission Upload (`server/controllers/submissionController.js`)

**Duplicate Check Logic**:
- Before creating a new submission, query the database for existing submissions with:
  - Same `assignmentId`
  - Same `originalFileName`
- If duplicate found:
  - Delete the uploaded file (cleanup)
  - Return HTTP 409 (Conflict) with detailed error message
  - Include information about the existing submission

**Response Format** (on duplicate):
```json
{
  "error": "Duplicate file detected",
  "message": "A submission with the filename \"assignment1.pdf\" already exists for this assignment. Please delete the previous submission or rename your file before uploading.",
  "existingSubmissionId": "507f1f77bcf86cd799439011",
  "existingStudentId": "student123",
  "existingStudentName": "John Doe"
}
```

#### 3. Batch Submission Upload (`server/controllers/submissionController.js`)

**Batch Processing**:
- Checks each file individually for duplicates
- Skips duplicate files and continues processing non-duplicates
- Tracks duplicate information in the response

**Response Format** (batch upload):
```json
{
  "message": "Batch submissions processed",
  "results": {
    "total": 10,
    "successful": 7,
    "failed": 0,
    "skipped": 3,
    "submissions": [...],
    "duplicates": [
      {
        "fileName": "student1.pdf",
        "existingSubmissionId": "...",
        "existingStudentId": "student1",
        "existingStudentName": "Student One"
      }
    ]
  }
}
```

### Frontend Changes

#### GradeMind Dashboard (`client/src/grademind/Dashboard.js`)

**Proactive Client-Side Check**:
- When files are selected for upload, check if any match existing student submissions in the current section
- Display warning alert listing duplicate filenames
- Only add non-duplicate files to the upload queue

**User Experience**:
```
⚠️ The following files were not added because they already exist:

student1.pdf
student2.ipynb

Please delete the existing submissions first if you want to replace them.
```

**Error Handling During Evaluation**:
- If a duplicate somehow gets through and the backend rejects it during evaluation
- The error message from the backend is displayed to the user
- The submission is marked as failed with the error details

---

## How It Works

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER UPLOADS FILE                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Check if filename exists in current section      │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   DUPLICATE?         NO DUPLICATE
        │                 │
        │                 ▼
        │      ┌──────────────────────┐
        │      │ Add to upload queue  │
        │      └──────────┬───────────┘
        │                 │
        │                 ▼
        │      ┌──────────────────────┐
        │      │ USER RUNS EVALUATION │
        │      └──────────┬───────────┘
        │                 │
        │                 ▼
        │      ┌──────────────────────────────────────────┐
        │      │ BACKEND: Check database for duplicate    │
        │      └──────────┬───────────────────────────────┘
        │                 │
        │        ┌────────┴────────┐
        │        │                 │
        │        ▼                 ▼
        │   DUPLICATE?         NO DUPLICATE
        │        │                 │
        │        │                 ▼
        │        │      ┌──────────────────────┐
        │        │      │ Save to database     │
        │        │      │ Queue for processing │
        │        │      └──────────────────────┘
        │        │
        ▼        ▼
┌─────────────────────────────────────────────────────────────┐
│ SHOW ERROR: "File already exists. Delete previous first."  │
└─────────────────────────────────────────────────────────────┘
```

### User Flow

1. **User selects files to upload**
   - Frontend checks against current section's submissions
   - Warns about duplicates immediately
   - Only non-duplicates are added to the queue

2. **User runs evaluation**
   - Each submission is uploaded to the backend
   - Backend performs another duplicate check against the database
   - Provides detailed error if duplicate is found

3. **To replace a submission**
   - User must delete the existing submission
   - Then upload the new file with the same name

---

## API Endpoints Affected

### POST `/api/submissions/single`

**Before**: Accepted any file upload  
**After**: Checks for duplicate `originalFileName` for the same `assignmentId`

**Error Response** (409 Conflict):
```json
{
  "error": "Duplicate file detected",
  "message": "A submission with the filename \"file.pdf\" already exists...",
  "existingSubmissionId": "...",
  "existingStudentId": "...",
  "existingStudentName": "..."
}
```

### POST `/api/submissions/batch`

**Before**: Accepted all files in batch  
**After**: Skips duplicate files, processes non-duplicates

**Success Response** (includes duplicate info):
```json
{
  "message": "Batch submissions processed",
  "results": {
    "total": 10,
    "successful": 7,
    "failed": 0,
    "skipped": 3,
    "submissions": [...],
    "duplicates": [...]
  }
}
```

---

## Testing

### Test Scenarios

#### 1. Single Upload - Duplicate File
**Steps**:
1. Upload a submission file (e.g., `student1.pdf`)
2. Wait for evaluation to complete
3. Try to upload another file named `student1.pdf` for the same assignment

**Expected Result**:
- Frontend shows warning alert
- If bypassed, backend returns 409 error
- Clear message explaining the duplicate

#### 2. Batch Upload - Some Duplicates
**Steps**:
1. Upload batch of 10 files
2. Wait for evaluation
3. Upload another batch with 5 duplicate and 5 new files

**Expected Result**:
- Frontend warns about the 5 duplicates
- Backend processes only the 5 new files
- Response shows `skipped: 5` and lists duplicates

#### 3. Delete and Re-upload
**Steps**:
1. Upload `student1.pdf`
2. Delete the submission
3. Upload `student1.pdf` again

**Expected Result**:
- Second upload succeeds (no duplicate)
- New submission is created and evaluated

#### 4. Different Assignments
**Steps**:
1. Upload `student1.pdf` to Assignment A
2. Upload `student1.pdf` to Assignment B

**Expected Result**:
- Both uploads succeed
- Duplicate check is per-assignment, not global

### Manual Testing Commands

```bash
# Test single upload duplicate
curl -X POST http://localhost:5000/api/submissions/single \
  -F "assignmentId=ASSIGNMENT_ID" \
  -F "studentId=student1" \
  -F "studentName=Student One" \
  -F "submission=@student1.pdf"

# Expected on duplicate: HTTP 409 with error message
```

---

## Edge Cases Handled

### 1. **Timing Issues**
- **Scenario**: Two users upload same filename simultaneously
- **Solution**: Database check happens atomically, one will fail

### 2. **File Cleanup**
- **Scenario**: File is uploaded but rejected as duplicate
- **Solution**: Backend immediately deletes the uploaded file to prevent clutter

### 3. **Case Sensitivity**
- **Scenario**: `Student1.pdf` vs `student1.pdf`
- **Solution**: Filenames are compared case-sensitively (as stored)

### 4. **Different File Types**
- **Scenario**: `assignment.pdf` and `assignment.ipynb`
- **Solution**: Treated as different files (extension included in filename)

### 5. **Batch Processing Partial Failure**
- **Scenario**: 10 files uploaded, 3 are duplicates
- **Solution**: Skip duplicates, process others, report both in response

---

## Configuration

No configuration required. Feature is enabled by default for all submission uploads.

---

## Rollback Plan

If this feature causes issues, rollback by:

1. **Remove backend duplicate check**:
   - Comment out the duplicate check section in `submissionController.js`
   - Remove `originalFileName` field population

2. **Remove frontend warning**:
   - Revert changes to `Dashboard.js` file upload handler

3. **Database migration** (optional):
   - The `originalFileName` field can remain in the schema (no breaking changes)
   - It will simply be null for new submissions

---

## Future Enhancements

1. **Replace Button**: Add a "Replace" button to existing submissions that:
   - Deletes the old submission
   - Uploads the new file
   - Maintains student information

2. **Version History**: Instead of preventing duplicates:
   - Keep multiple versions of the same filename
   - Show version history to users
   - Allow selecting which version to view

3. **Smart Rename**: Suggest alternative filenames:
   - `student1.pdf` → `student1_v2.pdf`
   - Automatically append timestamp or version number

4. **Bulk Replace**: For batch uploads:
   - Option to "Replace All Duplicates"
   - Automatically delete old submissions with matching names

---

## Troubleshooting

### Issue: Duplicate check not working

**Symptoms**: Files with same name can be uploaded multiple times

**Diagnosis**:
```bash
# Check if originalFileName is being saved
mongo edugrade
db.submissions.findOne({}, {originalFileName: 1, submissionFile: 1})
```

**Solution**: Ensure `originalFileName` is populated in the controller

### Issue: All files marked as duplicates

**Symptoms**: Every file upload is rejected

**Diagnosis**: Check if query is too broad (missing `assignmentId` filter)

**Solution**: Verify duplicate check includes both `assignmentId` AND `originalFileName`

### Issue: Deleted submissions still blocking uploads

**Symptoms**: After deleting a submission, can't upload same filename

**Diagnosis**:
```bash
# Check if submission was truly deleted
db.submissions.find({originalFileName: "student1.pdf"})
```

**Solution**: Ensure deletion actually removes the document (not just soft-delete)

---

## References

- **Backend Controller**: `server/controllers/submissionController.js`
- **Frontend Component**: `client/src/grademind/Dashboard.js`
- **Database Model**: `server/models/submission.js`
- **Related Issue**: Data integrity and user experience

---

**End of Documentation**

