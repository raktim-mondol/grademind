# Upload Blocking During Evaluation Feature

**Date**: December 16, 2025  
**Feature**: Prevent file uploads while evaluations are in progress  
**Status**: ✅ Complete

---

## 🎯 Overview

Users can no longer upload new submission files while any evaluation is currently in progress. They must wait for all evaluations to complete before uploading additional submissions.

---

## 📋 Problem Solved

### Before This Feature:
```
1. User uploads student1.pdf → Starts evaluation
2. User uploads student2.pdf → IMMEDIATELY starts evaluation (auto-queue)
3. Both evaluations run simultaneously
```

**Issues**:
- No control over evaluation queue
- Confusion about what's being evaluated
- No explicit user intent to start multiple evaluations

### After This Feature:
```
1. User uploads student1.pdf → Ready (pending)
2. User clicks "Start Evaluation" → Evaluating...
3. User tries to upload student2.pdf → ❌ BLOCKED!
   Message: "Cannot upload while evaluations are in progress"
4. Evaluation completes → Upload enabled again ✓
5. User can now upload student2.pdf
```

**Benefits**:
- ✅ User controls when evaluations start
- ✅ Clear feedback about system state
- ✅ No confusion about evaluation queue
- ✅ Prevents accidental auto-queuing

---

## 🔧 Implementation

### File Modified: `client/src/grademind/Dashboard.js`

#### 1. Enhanced `handleFileUpload` Function

Added check at the beginning of the function:

```javascript
const handleFileUpload = async (e) => {
  if (!activeSection) return;

  // Check if any submission is currently being evaluated
  const hasEvaluatingSubmissions = activeSection.students.some(s => s.status === 'grading');
  if (hasEvaluatingSubmissions) {
    alert('⚠️ Cannot upload new submissions while evaluations are in progress.\n\nPlease wait for all current evaluations to complete before uploading more submissions.');
    if (fileInputRef.current) fileInputRef.current.value = '';
    return;
  }

  // ... rest of upload logic
}
```

#### 2. Updated Upload Button UI (3 locations)

**Location 1: Empty section state**
```jsx
<label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
  isProcessing || activeSection?.students?.some(s => s.status === 'grading')
    ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
    : 'bg-black text-white cursor-pointer hover:bg-zinc-800 hover:shadow hover:-translate-y-0.5'
}`}>
  <Upload className="w-4 h-4" />
  Upload Submission
  <input
    type="file"
    ref={fileInputRef}
    className="hidden"
    multiple
    accept=".txt,.pdf,.md,.ipynb"
    onChange={handleFileUpload}
    disabled={isProcessing || activeSection?.students?.some(s => s.status === 'grading')}
  />
</label>
```

**Location 2: Section with existing students**
```jsx
<label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
  isProcessing || activeSection?.students?.some(s => s.status === 'grading')
    ? 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
    : 'bg-white border border-zinc-200 text-zinc-700 cursor-pointer hover:bg-black hover:text-white hover:border-black'
}`}>
  <Upload className="w-4 h-4" />
  Upload Submission
  <input 
    type="file" 
    ref={fileInputRef} 
    className="hidden" 
    multiple 
    accept=".txt,.pdf,.md,.ipynb" 
    onChange={handleFileUpload}
    disabled={isProcessing || activeSection?.students?.some(s => s.status === 'grading')}
  />
</label>
```

**Location 3: Assignment ready state**
```jsx
<label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
  isProcessing || activeSection?.students?.some(s => s.status === 'grading')
    ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
    : 'bg-zinc-900 text-white cursor-pointer hover:bg-zinc-800'
}`}>
  <Upload className="w-4 h-4" /> Upload Submission
  <input 
    type="file" 
    ref={fileInputRef} 
    className="hidden" 
    multiple 
    accept=".txt,.pdf,.md" 
    onChange={handleFileUpload}
    disabled={isProcessing || activeSection?.students?.some(s => s.status === 'grading')}
  />
</label>
```

#### 3. Added Status Indicator

Replaced "Start Evaluation" button area with dynamic status:

```jsx
{isProcessing || activeSection?.students?.some(s => s.status === 'grading') ? (
  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium">
    <Loader2 className="w-4 h-4 animate-spin" />
    Evaluating... Upload disabled
  </div>
) : activeSection?.students?.some(s => s.status === 'pending') && (
  <button
    onClick={runEvaluation}
    className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-black hover:text-white hover:border-black transition-all"
  >
    <Brain className="w-4 h-4" />
    Start Evaluation
  </button>
)}
```

---

## 🎨 Visual States

### State 1: Upload Enabled (No Evaluations Running)
```
┌──────────────────────────────────────┐
│ 📤 Upload Submission                 │  ← Black button, clickable
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ 🧠 Start Evaluation                  │  ← White button, clickable
└──────────────────────────────────────┘
```

### State 2: Upload Disabled (Evaluations In Progress)
```
┌──────────────────────────────────────┐
│ 📤 Upload Submission                 │  ← Gray/disabled, not clickable
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ ⏳ Evaluating... Upload disabled     │  ← Amber warning indicator
└──────────────────────────────────────┘
```

### State 3: Upload Enabled Again (All Evaluations Complete)
```
┌──────────────────────────────────────┐
│ 📤 Upload Submission                 │  ← Black/white button, clickable again
└──────────────────────────────────────┘
```

---

## 🔄 User Flow

### Scenario 1: Normal Flow
```
1. User uploads file → Status: pending
2. User clicks "Start Evaluation" → Status: grading
   ├─ Upload button becomes GRAY (disabled)
   └─ Shows "Evaluating... Upload disabled"
3. Evaluation completes → Status: completed
   ├─ Upload button becomes ACTIVE (enabled)
   └─ User can upload more files
```

### Scenario 2: Trying to Upload During Evaluation
```
1. Evaluation is running (status: grading)
2. User tries to click "Upload Submission" → Button is grayed out
3. User tries to upload anyway (file dialog) → Alert appears:
   
   ⚠️ Cannot upload new submissions while evaluations are in progress.
   
   Please wait for all current evaluations to complete before 
   uploading more submissions.
   
4. File selection is cancelled
5. User must wait for evaluation to finish
```

---

## 🧪 Testing

### Test Case 1: Upload Disabled During Evaluation
**Steps**:
1. Upload a file (student1.pdf)
2. Click "Start Evaluation"
3. Try to click "Upload Submission" button

**Expected**:
- Button is grayed out and not clickable
- Shows "Evaluating... Upload disabled" indicator

**Result**: ✅ Pass

---

### Test Case 2: Alert When Trying to Upload
**Steps**:
1. Upload a file and start evaluation
2. Force file dialog to open (if possible)
3. Select another file

**Expected**:
- Alert appears with clear message
- File selection is cancelled
- No new file is added

**Result**: ✅ Pass

---

### Test Case 3: Upload Re-enabled After Completion
**Steps**:
1. Upload a file and start evaluation
2. Wait for evaluation to complete
3. Try to upload another file

**Expected**:
- Upload button becomes active (not grayed out)
- File can be uploaded successfully
- "Start Evaluation" button appears for new file

**Result**: ✅ Pass

---

### Test Case 4: Multiple Files in Queue
**Steps**:
1. Upload 3 files (don't start evaluation)
2. Click "Start Evaluation"
3. Try to upload more files during evaluation

**Expected**:
- Upload blocked during all 3 evaluations
- Button grayed out until all 3 complete
- Re-enabled after last evaluation finishes

**Result**: ✅ Pass

---

## 📊 Technical Details

### Status Check Logic
```javascript
// Check if any submission is being evaluated
const hasEvaluatingSubmissions = activeSection.students.some(s => s.status === 'grading');

// Or using isProcessing flag
const uploadDisabled = isProcessing || activeSection?.students?.some(s => s.status === 'grading');
```

### Student Status Values
- `pending` - Uploaded, waiting for evaluation
- `grading` - Currently being evaluated ← **Blocks uploads**
- `completed` - Evaluation finished
- `failed` - Evaluation failed

### UI Conditional Styling
```javascript
className={`... ${
  isProcessing || activeSection?.students?.some(s => s.status === 'grading')
    ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'  // Disabled state
    : 'bg-black text-white cursor-pointer hover:...'   // Active state
}`}
```

---

## 💡 Key Features

### 1. Dual Protection
- **Visual**: Button is grayed out (user can see it's disabled)
- **Functional**: Alert if they somehow trigger upload

### 2. Clear Feedback
- Amber warning box: "Evaluating... Upload disabled"
- Disabled button styling (gray, no hover effects)
- Alert message with explanation

### 3. Automatic Re-enabling
- No manual action needed
- Button automatically becomes active when evaluations finish
- Seamless user experience

---

## 🎯 Benefits

### User Experience
- ✅ Clear visual feedback about system state
- ✅ Prevents confusion about evaluation queue
- ✅ Explicit control over when evaluations start
- ✅ No accidental auto-queuing

### System Behavior
- ✅ Predictable evaluation flow
- ✅ One batch at a time
- ✅ Easier to track progress
- ✅ Reduces server load spikes

### Code Quality
- ✅ Simple status check (`status === 'grading'`)
- ✅ Consistent across all UI locations
- ✅ No complex state management needed
- ✅ Works with existing status field

---

## 🔮 Edge Cases Handled

### 1. Multiple Sections
- Each section is checked independently
- Upload blocked only if current section has evaluating submissions
- Other sections not affected

### 2. Failed Evaluations
- Failed status doesn't block uploads
- Only `grading` status blocks uploads
- User can upload more files after failures

### 3. Page Refresh
- Upload state is derived from submission statuses
- No persistent state to lose
- Works correctly after refresh

### 4. Direct File Dialog Access
- Even if user bypasses button, `handleFileUpload` checks status
- Alert prevents file from being added
- Double protection (UI + logic)

---

## 📝 Error Messages

### User Alert:
```
⚠️ Cannot upload new submissions while evaluations are in progress.

Please wait for all current evaluations to complete before uploading more submissions.
```

**Characteristics**:
- Clear and concise
- Explains what's happening
- Tells user what to do
- Polite tone

---

## 🚀 Deployment

### No Configuration Needed
- Feature is automatically active
- Works with existing status tracking
- No database changes required

### Browser Compatibility
- Uses standard DOM `disabled` attribute
- CSS classes work in all modern browsers
- Alert() is universally supported

---

## 🔧 Maintenance

### To Modify Block Condition:
Change the status check in 4 locations:
1. `handleFileUpload` function (logic check)
2. Upload button 1 (empty section)
3. Upload button 2 (with students)
4. Upload button 3 (assignment ready)
5. Status indicator (shows warning)

### To Change UI Styling:
Update the conditional className in each `<label>` tag:
```javascript
className={`... ${
  uploadDisabled
    ? 'your-disabled-classes'
    : 'your-enabled-classes'
}`}
```

---

## 📚 Related Features

- **Duplicate File Prevention**: Checked before evaluation starts
- **Start Evaluation Button**: Only shows when uploads are pending and not evaluating
- **Progress Indicator**: Shows evaluation progress
- **Status Badges**: Show individual submission statuses

---

## ✅ Checklist

- [x] Logic check in `handleFileUpload`
- [x] Upload button 1 updated (empty section)
- [x] Upload button 2 updated (with students)
- [x] Upload button 3 updated (ready state)
- [x] Status indicator added
- [x] Alert message added
- [x] Input disabled attribute added
- [x] Visual styling updated (grayed out)
- [x] Tested all scenarios
- [x] No linter errors

---

## 🎉 Summary

**Status**: ✅ Feature Complete

**Changes**: 1 file modified (`Dashboard.js`)  
**Lines Changed**: ~50 lines  
**Testing**: Comprehensive  
**Ready**: Production

Users can now only upload files when no evaluations are running, providing clear control over the evaluation process.

---

**Last Updated**: December 16, 2025


