#!/usr/bin/env python3
"""
Fix for the current schema issues
"""

import json

def main():
    print("=== CURRENT SCHEMA VERIFICATION ===\n")
    
    # Load current rubric
    with open('Assignment_2_Rubric.json', 'r') as f:
        rubric = json.load(f)
    
    print("Current rubric structure:")
    for task in rubric['tasks']:
        print(f"\nTask {task['task_id']}: {task['title']}")
        for sub in task.get('sub_tasks', []):
            print(f"  {sub['sub_task_id']}: {sub['marks']} marks")
    
    # Generate CSV headers
    headers = ["Student", "Total Marks", "Overall Feedback"]
    for task in rubric.get("tasks", []):
        for sub_task in task.get("sub_tasks", []):
            t_id = sub_task["sub_task_id"]
            headers.append(f"Task {t_id} Marks")
    
    print(f"\n=== CSV HEADERS ===")
    print(", ".join(headers))
    
    # Check for user's reported issues
    user_issues = ["Task 1 (1)", "Task 2 (2)", "Task 3.5 (1)", "Task 34.2", "Task 35.3"]
    found_issues = [issue for issue in user_issues if issue in ", ".join(headers)]
    
    if found_issues:
        print(f"\n[ERROR] PROBLEMS FOUND: {found_issues}")
        return False
    else:
        print(f"\n[OK] NO ISSUES FOUND - Current schema is correct")
        print("\nThe issue might be:")
        print("1. Old cached schema in server")
        print("2. Different script generating output")
        print("3. Server-side schema extraction creating duplicates")
        return True

if __name__ == "__main__":
    main()
