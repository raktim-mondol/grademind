#!/usr/bin/env python3
"""
Fix for rubric schema extraction issues
This script ensures the Assignment_2_Rubric.json file is properly formatted
and provides a template for fixing the server-side schema extraction
"""

import json
import re

def fix_rubric_schema():
    """Fix any issues in the rubric schema"""
    
    print("=== RUBRIC SCHEMA FIX ===\n")
    
    # Load current rubric
    with open('Assignment_2_Rubric.json', 'r') as f:
        rubric = json.load(f)
    
    # Track all subtask IDs to detect duplicates
    all_ids = set()
    duplicates = []
    
    def normalize_subtask_id(sub_id):
        """Normalize subtask ID to proper dot notation"""
        # Remove "Task" prefix
        sub_id = re.sub(r'^Task\s*', '', sub_id, flags=re.IGNORECASE)
        
        # Convert parenthetical format: "1(1.1)" -> "1.1", "3(2.1)" -> "3.2.1"
        sub_id = re.sub(r'(\d+(?:\.\d+)*)\(([^)]+)\)', 
                       lambda m: f"{m.group(1)}.{m.group(2)}", sub_id)
        
        # Remove any non-digit/dot characters
        sub_id = re.sub(r'[^\d.]', '', sub_id)
        
        # Remove leading/trailing dots
        sub_id = sub_id.strip('.')
        
        return sub_id
    
    def process_subtasks(task_id, sub_tasks, level=0):
        """Recursively process and fix subtasks"""
        fixed_subtasks = []
        
        for sub in sub_tasks:
            original_id = sub['sub_task_id']
            normalized_id = normalize_subtask_id(original_id)
            
            # Create full ID for duplicate detection
            full_id = f"{task_id}.{normalized_id}" if task_id else normalized_id
            
            if full_id in all_ids:
                duplicates.append(full_id)
                print(f"  [DUPLICATE] Skipping: {original_id} -> {full_id}")
                continue
                
            all_ids.add(full_id)
            
            # Update the subtask with normalized ID
            sub['sub_task_id'] = normalized_id
            
            # Process nested subtasks if any
            if 'sub_tasks' in sub and sub['sub_tasks']:
                sub['sub_tasks'] = process_subtasks(full_id, sub['sub_tasks'], level + 1)
            
            fixed_subtasks.append(sub)
            
            if original_id != normalized_id:
                print(f"  [FIXED] {original_id} -> {normalized_id}")
        
        return fixed_subtasks
    
    # Process each task
    for task in rubric['tasks']:
        task_id = task['task_id']
        print(f"Task {task_id}:")
        
        if 'sub_tasks' in task:
            task['sub_tasks'] = process_subtasks(task_id, task['sub_tasks'])
    
    # Save fixed rubric
    with open('Assignment_2_Rubric.json', 'w') as f:
        json.dump(rubric, f, indent=4)
    
    print(f"\n=== RESULTS ===")
    print(f"Fixed {len(duplicates)} duplicates")
    print(f"Total unique subtasks: {len(all_ids)}")
    
    # Generate expected CSV headers
    headers = ["Student", "Total Marks", "Overall Feedback"]
    for task in rubric['tasks']:
        for sub in task.get('sub_tasks', []):
            headers.append(f"Task {sub['sub_task_id']} Marks")
    
    print(f"\nExpected CSV headers:")
    print(", ".join(headers))
    
    return rubric

def create_server_side_fix():
    """Create a fix for the server-side schema extraction"""
    
    fix_code = '''
// ENHANCED SCHEMA EXTRACTION FIX
// Add this to server/utils/geminiService.js in the analyzeRubricForSchema function

// After line 806 (after normalizeTaskIds), add enhanced deduplication:

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
            subId = subId.replace(/^Task\\s*/i, '');
            
            // CRITICAL FIX 2: Convert ALL parenthetical formats to dot notation
            // This handles: "1(1.1)", "3(2.1)", "1(a)", "3.2(i)", etc.
            subId = subId.replace(/(\\d+(?:\\.\\d+)*)\\(([^)]+)\\)/g, (match, prefix, content) => {
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
                if (/^\\d+$/.test(content)) {
                    return `${prefix}.${content}`;
                }
                
                // Handle nested like "2.1"
                return `${prefix}.${content}`;
            });
            
            // CRITICAL FIX 3: Remove standalone letters (1a -> 1.1)
            subId = subId.replace(/(\\d+(?:\\.\\d+)*)([a-z])$/i, (match, prefix, letter) => {
                const num = letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1;
                return `${prefix}.${num}`;
            });
            
            // CRITICAL FIX 4: Clean up any remaining non-standard characters
            subId = subId.replace(/[^\\d.]/g, '');
            
            // CRITICAL FIX 5: Remove leading/trailing dots
            subId = subId.replace(/^\\.+|\\. +$/g, '');
            
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

// In the analyzeRubricForSchema function, replace the existing deduplication with:
// extractedSchema = enhancedDeduplication(extractedSchema);
'''
    
    with open('server_side_fix.js', 'w') as f:
        f.write(fix_code)
    
    print("\n=== SERVER-SIDE FIX CREATED ===")
    print("File: server_side_fix.js")
    print("This fix should be applied to server/utils/geminiService.js")

if __name__ == "__main__":
    # Fix the current rubric
    fixed_rubric = fix_rubric_schema()
    
    # Create server-side fix
    create_server_side_fix()
    
    print("\n=== SUMMARY ===")
    print("1. Current rubric file has been verified and fixed if needed")
    print("2. Server-side fix created for schema extraction")
    print("3. The issue was likely in the server-side schema extraction creating duplicates")
    print("4. Apply the server-side fix to prevent future issues")
