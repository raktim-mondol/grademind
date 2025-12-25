#!/usr/bin/env python3
"""
Test the evaluation logic to ensure it's working correctly
"""

import json

# Load rubric
with open('Assignment_2_Rubric.json', 'r') as f:
    rubric = json.load(f)

# Simulate what evaluate_submissions.py does
all_task_ids = []
for task_group in rubric.get("tasks", []):
    for sub_task in task_group.get("sub_tasks", []):
        t_id = sub_task["sub_task_id"]
        all_task_ids.append(t_id)

print("=== ALL TASK IDs ===")
print(all_task_ids)

# Simulate Gemini response for a student
gemini_response = {
    "results": [
        {"task_id": "1.1", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "1.2", "marks_awarded": 0.5, "max_marks": 0.5, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "1.3", "marks_awarded": 0.5, "max_marks": 0.5, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "2.1", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "2.2", "marks_awarded": 2.0, "max_marks": 2.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.1", "marks_awarded": 2.0, "max_marks": 2.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.2.1", "marks_awarded": 0.0, "max_marks": 2.0, "feedback": "Missing plots.", "issues": ["Missing Plot"]},
        {"task_id": "3.2.2", "marks_awarded": 0.0, "max_marks": 1.0, "feedback": "Missing analysis.", "issues": ["Missing Analysis"]},
        {"task_id": "3.2.3", "marks_awarded": 0.0, "max_marks": 1.0, "feedback": "Missing discussion.", "issues": ["Missing Discussion"]},
        {"task_id": "3.3.1", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.3.2", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.3.3", "marks_awarded": 2.0, "max_marks": 2.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.3.4", "marks_awarded": 2.0, "max_marks": 2.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.3.5", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.4.1", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.4.2", "marks_awarded": 2.0, "max_marks": 2.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.4.3", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.5.1", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.5.2", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
        {"task_id": "3.5.3", "marks_awarded": 1.0, "max_marks": 1.0, "feedback": "Correct implementation.", "issues": []},
    ]
}

# Simulate the mapping logic from evaluate_submissions.py
student_results = {"Student": "test_student.ipynb", "Total Marks": 0}
deductions = []

# Initialize default marks
for t_id in all_task_ids:
    student_results[f"Task {t_id} Marks"] = 0

# Map results
results_list = gemini_response.get("results", [])
for result in results_list:
    t_id = result.get("task_id")
    marks = result.get("marks_awarded", 0)
    feedback = result.get("feedback", "")
    max_marks = result.get("max_marks", 0)
    
    if t_id in all_task_ids:
        student_results[f"Task {t_id} Marks"] = marks
        student_results["Total Marks"] += marks
        
        if marks < max_marks:
            deductions.append(f"Task {t_id} (-{max_marks - marks:.1f}): {feedback}")
    else:
        print(f"Warning: Gemini returned unknown task_id {t_id}")

# Handle missing evaluations
evaluated_ids = [r.get("task_id") for r in results_list]
for t_id in all_task_ids:
    if t_id not in evaluated_ids:
        deductions.append(f"Task {t_id}: Not evaluated by AI (Error).")

# Generate overall feedback
if not deductions:
    student_results["Overall Feedback"] = "Excellent work! Full marks on auto-graded tasks."
else:
    student_results["Overall Feedback"] = " | ".join(deductions)

print("\n=== STUDENT RESULTS ===")
for key, value in student_results.items():
    if key != "Student":
        print(f"{key}: {value}")

print(f"\nTotal Marks: {student_results['Total Marks']}")
print(f"Feedback: {student_results['Overall Feedback']}")

# Verify against expected
expected_total = 1 + 0.5 + 0.5 + 1 + 2 + 2 + 0 + 0 + 0 + 1 + 1 + 2 + 2 + 1 + 1 + 2 + 1 + 1 + 1 + 1
print(f"\nExpected Total: {expected_total}")
print(f"Calculated Total: {student_results['Total Marks']}")
print(f"Match: {expected_total == student_results['Total Marks']}")
