#!/usr/bin/env python3
"""
Test to verify the schema extraction fix is working
"""

import json

# Simulate what the server-side code does
def test_schema_processing():
    print("=== Testing Schema Processing ===\n")
    
    # This is what the current Assignment_2_Rubric.json looks like
    current_rubric = {
        "title": "COMP9414 Assignment 2 - Rubric",
        "total_marks": 25,
        "tasks": [
            {
                "task_id": "1",
                "title": "Task 1: Data Preprocessing",
                "sub_tasks": [
                    {"sub_task_id": "1.1", "marks": 1.0},
                    {"sub_task_id": "1.2", "marks": 0.5},
                    {"sub_task_id": "1.3", "marks": 0.5}
                ]
            },
            {
                "task_id": "2",
                "title": "Task 2: Model Training",
                "sub_tasks": [
                    {"sub_task_id": "2.1", "marks": 1.0},
                    {"sub_task_id": "2.2", "marks": 2.0}
                ]
            },
            {
                "task_id": "3",
                "title": "Task 3: Report",
                "sub_tasks": [
                    {"sub_task_id": "3.1", "marks": 2.0},
                    {"sub_task_id": "3.2.1", "marks": 2.0},
                    {"sub_task_id": "3.2.2", "marks": 1.0},
                    {"sub_task_id": "3.2.3", "marks": 1.0},
                    {"sub_task_id": "3.3.1", "marks": 1.0},
                    {"sub_task_id": "3.3.2", "marks": 1.0},
                    {"sub_task_id": "3.3.3", "marks": 2.0},
                    {"sub_task_id": "3.3.4", "marks": 2.0},
                    {"sub_task_id": "3.3.5", "marks": 1.0},
                    {"sub_task_id": "3.4.1", "marks": 1.0},
                    {"sub_task_id": "3.4.2", "marks": 2.0},
                    {"sub_task_id": "3.4.3", "marks": 1.0},
                    {"sub_task_id": "3.5.1", "marks": 1.0},
                    {"sub_task_id": "3.5.2", "marks": 1.0},
                    {"sub_task_id": "3.5.3", "marks": 1.0}
                ]
            }
        ]
    }
    
    # Test what the normalizeTaskIds function would do
    print("1. Testing normalizeTaskIds function:")
    
    def normalize_task_ids(task, task_idx, level=0):
        indent = "  " * level
        
        # Normalize main task ID
        original_task_id = task['task_id']
        import re
        task['task_id'] = re.sub(r'^Task\s*', '', str(task['task_id']), flags=re.IGNORECASE)
        task['task_id'] = re.sub(r'[^\d.]', '', task['task_id'])
        
        if original_task_id != task['task_id']:
            print(f"{indent}Task {task_idx + 1}: '{original_task_id}' → '{task['task_id']}'")
        
        # Normalize subtask IDs
        if 'sub_tasks' in task and isinstance(task['sub_tasks'], list):
            for sub_idx, subtask in enumerate(task['sub_tasks']):
                original_sub_id = subtask['sub_task_id']
                normalized_id = str(subtask['sub_task_id'])
                
                # Remove "Task" prefix
                normalized_id = re.sub(r'^Task\s*', '', normalized_id, flags=re.IGNORECASE)
                
                # Fix parenthetical format
                import re
                normalized_id = re.sub(r'(\d+(?:\.\d+)*)\(([^)]+)\)', 
                                      lambda m: f"{m.group(1)}.{m.group(2)}", normalized_id)
                
                # Remove standalone letters
                normalized_id = re.sub(r'(\d+(?:\.\d+)*)([a-z])$', 
                                      lambda m: f"{m.group(1)}.{ord(m.group(2).lower()) - ord('a') + 1}", normalized_id)
                
                # Clean up
                normalized_id = re.sub(r'[^\d.]', '', normalized_id)
                
                subtask['sub_task_id'] = normalized_id
                
                if original_sub_id != normalized_id:
                    print(f"{indent}  Subtask: '{original_sub_id}' → '{normalized_id}'")
    
    # Apply to test
    test_rubric = json.loads(json.dumps(current_rubric))
    for idx, task in enumerate(test_rubric['tasks']):
        normalize_task_ids(task, idx, 1)
    
    print("\n2. After normalization:")
    for task in test_rubric['tasks']:
        print(f"Task {task['task_id']}: {[s['sub_task_id'] for s in task['sub_tasks']]}")
    
    # Test deduplication
    print("\n3. Testing deduplication:")
    
    def remove_duplicates(task, level=0):
        indent = "  " * level
        
        if 'sub_tasks' in task and isinstance(task['sub_tasks'], list):
            seen = set()
            unique = []
            
            for sub in task['sub_tasks']:
                sub_id = sub['sub_task_id']
                
                if sub_id in seen:
                    print(f"{indent}[DUPLICATE] Removing: {sub_id}")
                else:
                    seen.add(sub_id)
                    unique.append(sub)
            
            task['sub_tasks'] = unique
    
    for task in test_rubric['tasks']:
        remove_duplicates(task, 1)
    
    print("\n4. Final result:")
    all_ids = []
    for task in test_rubric['tasks']:
        for sub in task['sub_tasks']:
            all_ids.append(sub['sub_task_id'])
    
    print(f"Total subtasks: {len(all_ids)}")
    print(f"IDs: {', '.join(all_ids)}")
    
    # Check against expected
    expected = ['1.1', '1.2', '1.3', '2.1', '2.2', '3.1', '3.2.1', '3.2.2', '3.2.3', '3.3.1', '3.3.2', '3.3.3', '3.3.4', '3.3.5', '3.4.1', '3.4.2', '3.4.3', '3.5.1', '3.5.2', '3.5.3']
    
    if all_ids == expected:
        print("\n[OK] SUCCESS: All IDs match expected!")
    else:
        print(f"\n[ERROR] MISMATCH: Expected {len(expected)}, got {len(all_ids)}")
        print(f"Missing: {set(expected) - set(all_ids)}")
        print(f"Extra: {set(all_ids) - set(expected)}")

if __name__ == "__main__":
    test_schema_processing()
