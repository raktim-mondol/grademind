#!/usr/bin/env python3
import json

with open('Assignment_2_Rubric.json', 'r') as f:
    rubric = json.load(f)

print("=== ACTUAL RUBRIC STRUCTURE ===")
for task in rubric['tasks']:
    print(f"\nTask {task['task_id']}: {task['title']}")
    for sub in task.get('sub_tasks', []):
        print(f"  - {sub['sub_task_id']}: {sub['description'][:50]}... ({sub['marks']} marks)")
        if 'sub_tasks' in sub and sub['sub_tasks']:
            for nested in sub['sub_tasks']:
                print(f"    - {nested['sub_task_id']}: {nested['description'][:40]}... ({nested['marks']} marks)")

print("\n=== CSV HEADERS THAT WOULD BE GENERATED ===")
headers = ["Student", "Total Marks", "Overall Feedback"]
for task in rubric.get("tasks", []):
    for sub_task in task.get("sub_tasks", []):
        t_id = sub_task["sub_task_id"]
        headers.append(f"Task {t_id} Marks")

print(", ".join(headers))
