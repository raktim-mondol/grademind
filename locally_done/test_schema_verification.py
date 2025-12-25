#!/usr/bin/env python3
"""
Test script to verify the rubric schema is correct and identify any issues
"""

import json
import re

def test_rubric_schema():
    """Test the current rubric schema for issues"""
    
    # Load the rubric
    with open('Assignment_2_Rubric.json', 'r') as f:
        rubric = json.load(f)
    
    print("=== RUBRIC SCHEMA VERIFICATION ===\n")
    
    # Check structure
    print(f"Total tasks: {len(rubric['tasks'])}")
    print(f"Total marks: {rubric['total_marks']}")
    print()
    
    # Collect all subtask IDs
    all_subtask_ids = []
    duplicates = []
    
    def collect_subtasks(task, path=""):
        task_id = task.get('task_id', '')
        sub_tasks = task.get('sub_tasks', [])
        
        for sub in sub_tasks:
            sub_id = sub.get('sub_task_id', '')
            full_id = f"{task_id}.{sub_id}" if task_id and sub_id else sub_id
            
            if full_id in all_subtask_ids:
                duplicates.append(full_id)
            else:
                all_subtask_ids.append(full_id)
            
            # Check for nested subtasks
            if 'sub_tasks' in sub and sub['sub_tasks']:
                # For nested subtasks, the full_id becomes the new "task_id" context
                collect_subtasks({'task_id': full_id, 'sub_tasks': sub['sub_tasks']}, full_id)
    
    for task in rubric['tasks']:
        collect_subtasks(task)
    
    print(f"Total unique subtasks: {len(all_subtask_ids)}")
    print(f"Subtask IDs: {all_subtask_ids}")
    print()
    
    if duplicates:
        print(f"[ERROR] DUPLICATES FOUND: {duplicates}")
    else:
        print("[OK] No duplicates found")
    
    # Check for problematic formats
    problematic = []
    for task in rubric['tasks']:
        for sub in task.get('sub_tasks', []):
            sub_id = sub.get('sub_task_id', '')
            
            # Check for parentheses format
            if '(' in sub_id or ')' in sub_id:
                problematic.append(f"Parentheses in {sub_id}")
            
            # Check for "Task" prefix
            if sub_id.lower().startswith('task'):
                problematic.append(f"Task prefix in {sub_id}")
            
            # Check for letters instead of numbers
            if re.search(r'[a-z]', sub_id, re.IGNORECASE):
                # Allow dots and numbers, but not standalone letters
                if not re.match(r'^[\d.]+$', sub_id):
                    problematic.append(f"Letters in {sub_id}")
    
    if problematic:
        print(f"[ERROR] PROBLEMATIC FORMATS: {problematic}")
    else:
        print("[OK] All formats are correct (dot notation)")
    
    # Check marks are numeric
    marks_issues = []
    for task in rubric['tasks']:
        for sub in task.get('sub_tasks', []):
            marks = sub.get('marks')
            if marks is not None and not isinstance(marks, (int, float)):
                marks_issues.append(f"Non-numeric marks for {sub.get('sub_task_id')}: {marks} ({type(marks)})")
    
    if marks_issues:
        print(f"[ERROR] MARKS ISSUES: {marks_issues}")
    else:
        print("[OK] All marks are numeric")
    
    print("\n=== CSV HEADER GENERATION TEST ===\n")
    
    # Simulate what evaluate_submissions.py does
    headers = ["Student", "Total Marks", "Overall Feedback"]
    for task in rubric.get("tasks", []):
        for sub_task in task.get("sub_tasks", []):
            t_id = sub_task["sub_task_id"]
            headers.append(f"Task {t_id} Marks")
    
    print("Generated headers:")
    print(", ".join(headers))
    print()
    
    # Check for the specific issues user mentioned
    user_issues = [
        "Task 1 (1)", "Task 2 (2)", "Task 3.5 (1)",  # Wrong format
        "Task 34.2", "Task 35.3"  # Redundant/extraneous
    ]
    
    found_issues = []
    for issue in user_issues:
        if issue in ", ".join(headers):
            found_issues.append(issue)
    
    if found_issues:
        print(f"[ERROR] User-reported issues found in headers: {found_issues}")
    else:
        print("[OK] No user-reported issues found in headers")
    
    return len(duplicates) == 0 and len(problematic) == 0 and len(marks_issues) == 0 and len(found_issues) == 0

if __name__ == "__main__":
    success = test_rubric_schema()
    print(f"\n{'='*50}")
    print(f"OVERALL RESULT: {'PASS' if success else 'FAIL'}")
    print(f"{'='*50}")
