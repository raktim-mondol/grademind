#!/usr/bin/env python3
import json

# Load rubric
with open('Assignment_2_Rubric.json', 'r') as f:
    rubric = json.load(f)

print("=== RUBRIC STRUCTURE ===")
all_tasks = []
for task in rubric['tasks']:
    print(f"\nTask {task['task_id']}: {task['title']}")
    for sub in task.get('sub_tasks', []):
        full_id = f"{task['task_id']}.{sub['sub_task_id']}" if '.' not in sub['sub_task_id'] else sub['sub_task_id']
        print(f"  {full_id}: {sub['marks']} marks")
        all_tasks.append(full_id)

print(f"\n=== ALL TASK IDs ===")
print(", ".join(all_tasks))

print(f"\n=== EXPECTED CSV HEADERS ===")
headers = ["Student", "Total Marks", "Overall Feedback"]
for task in rubric.get("tasks", []):
    for sub_task in task.get("sub_tasks", []):
        t_id = sub_task["sub_task_id"]
        headers.append(f"Task {t_id} Marks")

print(", ".join(headers))

# Check what the current CSV has
print(f"\n=== CURRENT CSV (from 4473_grading_report.csv) ===")
print("Task 1.1 Marks, Task 1.2 Marks, Task 1.3 Marks, Task 2.1 Marks, Task 2.2 Marks, Task 3.1 Marks, Task 3.2.1 Marks, Task 3.2.2 Marks, Task 3.2.3 Marks, Task 3.3.1 Marks, Task 3.3.2 Marks, Task 3.3.3 Marks, Task 3.3.4 Marks, Task 3.3.5 Marks, Task 3.4.1 Marks, Task 3.4.2 Marks, Task 3.4.3 Marks, Task 3.5.1 Marks, Task 3.5.2 Marks, Task 3.5.3 Marks")

print(f"\n=== COMPARISON ===")
csv_headers = ["Task 1.1 Marks", "Task 1.2 Marks", "Task 1.3 Marks", "Task 2.1 Marks", "Task 2.2 Marks", "Task 3.1 Marks", "Task 3.2.1 Marks", "Task 3.2.2 Marks", "Task 3.2.3 Marks", "Task 3.3.1 Marks", "Task 3.3.2 Marks", "Task 3.3.3 Marks", "Task 3.3.4 Marks", "Task 3.3.5 Marks", "Task 3.4.1 Marks", "Task 3.4.2 Marks", "Task 3.4.3 Marks", "Task 3.5.1 Marks", "Task 3.5.2 Marks", "Task 3.5.3 Marks"]

expected_headers = [f"Task {t} Marks" for t in all_tasks]

print("CSV headers match expected:", csv_headers == expected_headers)
if csv_headers != expected_headers:
    print("CSV:", csv_headers)
    print("Expected:", expected_headers)
