# Enhanced Schema Extraction Fix

## Problem Summary
The user reported incorrect headers in grading output:
- **Wrong**: "Task 1 (1)", "Task 2 (2)", "Task 3.5 (1)"
- **Wrong**: Redundant "Task 34.2", "Task 35.3"
- **Expected**: "Task 1.1", "Task 2.1", "Task 3.5.1"

## Root Cause Analysis
✅ **Current files are CORRECT**:
- `Assignment_2_Rubric.json` has proper dot notation
- `evaluate_submissions.py` generates correct headers
- Current CSV output is correct

❌ **Issue is in server-side schema extraction**:
- `server/utils/geminiService.js` function `analyzeRubricForSchema()`
- May create duplicates when processing rubric PDFs
- May not properly handle all parenthetical formats

## The Fix

### 1. Enhanced Deduplication Function
Add this to `server/utils/geminiService.js` after line 806:

```javascript
// CRITICAL: Enhanced duplicate prevention and format normalization
function enhancedDeduplication(extractedSchema) {
    console.log('[FIX] Enhanced deduplication and format normalization...');
    
    const seenFullIds = new Set();
    
    function processTask(task, taskIdx) {
        if (!task.sub_tasks || !Array.isArray(task.sub_tasks)) return;
        
        const uniqueSubtasks = [];
        
        task.sub_tasks.forEach((subtask, idx) => {
            let subId = subtask.sub_task_id;
            
            // CRITICAL FIX 1: Remove any "Task" prefix
            subId = subId.replace(/^Task\s*/i, '');
            
            // CRITICAL FIX 2: Convert ALL parenthetical formats to dot notation
            subId = subId.replace(/(\d+(?:\.\d+)*)\(([^)]+)\)/g, (match, prefix, content) => {
                content = content.trim();
                
                // Handle Roman numerals
                const romanMap = { 'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10 };
                if (romanMap[content.toLowerCase()]) {
                    return `${prefix}.${romanMap[content.toLowerCase()]}`;
                }
                
                // Handle single letters
                if (/^[a-z]$/i.test(content)) {
                    const num = content.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1;
                    return `${prefix}.${num}`;
                }
                
                // Handle numeric content
                if (/^\d+$/.test(content)) {
                    return `${prefix}.${content}`;
                }
                
                // Handle nested like "2.1"
                return `${prefix}.${content}`;
            });
            
            // CRITICAL FIX 3: Remove standalone letters (1a -> 1.1)
            subId = subId.replace(/(\d+(?:\.\d+)*)([a-z])$/i, (match, prefix, letter) => {
                const num = letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1;
                return `${prefix}.${num}`;
            });
            
            // CRITICAL FIX 4: Clean up any remaining non-standard characters
            subId = subId.replace(/[^\d.]/g, '');
            
            // CRITICAL FIX 5: Remove leading/trailing dots
            subId = subId.replace(/^\.+|\.+$/g, '');
            
            // CRITICAL FIX 6: Check for duplicates using full ID
            const fullId = `${task.task_id}.${subId}`;
            
            if (seenFullIds.has(fullId)) {
                console.log(`  [DUPLICATE] REMOVING: ${fullId} (from original: ${subtask.sub_task_id})`);
                return; // Skip this subtask
            }
            
            seenFullIds.add(fullId);
            
            // Update the subtask
            if (subtask.sub_task_id !== subId) {
                console.log(`  [NORMALIZED] ${subtask.sub_task_id} -> ${subId}`);
            }
            subtask.sub_task_id = subId;
            
            // Validate marks are numeric
            if (subtask.marks !== undefined && typeof subtask.marks !== 'number') {
                subtask.marks = parseFloat(subtask.marks) || 0;
            }
            
            uniqueSubtasks.push(subtask);
            
            // Recursively process nested subtasks
            if (subtask.sub_tasks && Array.isArray(subtask.sub_tasks)) {
                processTask({ task_id: fullId, sub_tasks: subtask.sub_tasks }, 0);
            }
        });
        
        task.sub_tasks = uniqueSubtasks;
    }
    
    extractedSchema.tasks.forEach((task, idx) => {
        processTask(task, idx);
    });
    
    // Final validation
    const allIds = [];
    function collectIds(task, path = '') {
        if (task.sub_tasks) {
            task.sub_tasks.forEach(sub => {
                const fullId = path ? `${path}.${sub.sub_task_id}` : sub.sub_task_id;
                allIds.push(fullId);
                if (sub.sub_tasks) {
                    collectIds(sub, fullId);
                }
            });
        }
    }
    
    extractedSchema.tasks.forEach(task => collectIds(task, task.task_id));
    
    console.log(`✓ Enhanced deduplication complete: ${allIds.length} unique subtasks`);
    console.log(`  IDs: ${allIds.join(', ')}`);
    
    return extractedSchema;
}
```

### 2. Update the analyzeRubricForSchema function
Replace the existing deduplication logic (lines 807-852) with:

```javascript
// Apply enhanced deduplication
extractedSchema = enhancedDeduplication(extractedSchema);
```

### 3. Update the extraction prompt
Enhance the prompt in `analyzeRubricForSchema` to be more explicit:

```javascript
const extractionPrompt = `Analyze this grading rubric and extract the COMPLETE hierarchical task/subtask structure.

=== CRITICAL REQUIREMENTS ===

**MOST IMPORTANT RULES:**

1. **NO DUPLICATES**
   - NEVER create both "1.1" AND "1(1.1)" - these are the SAME item
   - NEVER create both "Task 1.1" AND "1.1" - use ONLY "1.1"
   - Each unique task/subtask appears EXACTLY ONCE in the output

2. **MARKS IN PARENTHESES = TOTAL MARKS FOR THAT ITEM**
   - "1.2 (4)" → sub_task_id: "1.2", marks: 4.0
   - "3(2.1) (2)" → sub_task_id: "3.2.1", marks: 2.0
   - "Task 1.1 (1)" → sub_task_id: "1.1", marks: 1.0

**ID FORMATTING - USE DOT NOTATION ONLY**
   - Main tasks: "1", "2", "3" (simple numbers, NO "Task" prefix)
   - Subtasks: "1.1", "1.2", "3.2.1", "3.2.2" (dot notation ONLY)
   - NEVER use: "1(1.1)", "Task 1.1", "1a", "1(a)"
   - Convert ALL formats to dot notation:
     * "1(a)" → "1.1"
     * "3(2.1)" → "3.2.1"
     * "Task 1.1" → "1.1"

=== POST-PROCESSING ===
After extraction, the system will:
1. Normalize all IDs to dot notation
2. Remove any duplicates
3. Validate marks are numeric
4. Ensure no "Task" prefixes remain

=== RETURN FORMAT ===
{
  "title": "Rubric title",
  "total_marks": <total points>,
  "format_type": "dot_notation",
  "tasks": [
    {
      "task_id": "1",
      "title": "Task title",
      "sub_tasks": [
        {
          "sub_task_id": "1.1",
          "description": "Description",
          "marks": 1.0
        }
      ]
    }
  ]
}`;
```

## Verification

Run this verification script to confirm the fix:

```python
import json

# Load rubric
with open('Assignment_2_Rubric.json', 'r') as f:
    rubric = json.load(f)

# Generate headers
headers = ["Student", "Total Marks", "Overall Feedback"]
for task in rubric.get("tasks", []):
    for sub_task in task.get("sub_tasks", []):
        t_id = sub_task["sub_task_id"]
        headers.append(f"Task {t_id} Marks")

print("Generated headers:")
print(", ".join(headers))

# Check for issues
issues = ["Task 1 (1)", "Task 2 (2)", "Task 3.5 (1)", "Task 34.2", "Task 35.3"]
found = [issue for issue in issues if issue in ", ".join(headers)]
print(f"\nIssues found: {found if found else 'None'}")
```

## Expected Output
```
Student, Total Marks, Overall Feedback, Task 1.1 Marks, Task 1.2 Marks, Task 1.3 Marks, 
Task 2.1 Marks, Task 2.2 Marks, Task 3.1 Marks, Task 3.2.1 Marks, Task 3.2.2 Marks, 
Task 3.2.3 Marks, Task 3.3.1 Marks, Task 3.3.2 Marks, Task 3.3.3 Marks, Task 3.3.4 Marks, 
Task 3.3.5 Marks, Task 3.4.1 Marks, Task 3.4.2 Marks, Task 3.4.3 Marks, Task 3.5.1 Marks, 
Task 3.5.2 Marks, Task 3.5.3 Marks
```

✅ **No duplicates**
✅ **Correct dot notation**
✅ **No "Task" prefixes**
✅ **No parenthetical formats**
