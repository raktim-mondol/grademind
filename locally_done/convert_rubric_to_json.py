import json
from docx import Document

def convert_docx_to_json():
    try:
        doc = Document('Assignment_2_Rubric.docx')
        
        rubric = {
            "title": "COMP9414 Assignment 2 - Rubric",
            "subtitle": "Neural Networks, Tree-based and Ensemble Methods",
            "total_marks": 25,
            "tasks": []
        }
        
        current_task = None
        
        for table in doc.tables:
            # Determine task based on previous heading or context (simplified here since we know the structure)
            # We'll assume tables appear in order: Task 1, Task 2, Task 3
            
            # Simple heuristic: check the first row cells
            if len(table.rows) > 0:
                rows = table.rows
                # Skip header row
                for i in range(1, len(rows)):
                    cells = rows[i].cells
                    sub_task = cells[0].text.strip()
                    description = cells[1].text.strip()
                    marks = cells[2].text.strip()
                    
                    # Determine which main task this belongs to based on sub_task prefix
                    main_task_id = sub_task.split('.')[0]
                    
                    # Find or create task entry
                    task_entry = next((t for t in rubric["tasks"] if t["task_id"] == main_task_id), None)
                    if not task_entry:
                        task_title = f"Task {main_task_id}"
                        # Add specific titles based on known structure
                        if main_task_id == "1": task_title += ": Data Preprocessing"
                        elif main_task_id == "2": task_title += ": Model Training"
                        elif main_task_id == "3": task_title += ": Report"
                        
                        task_entry = {
                            "task_id": main_task_id,
                            "title": task_title,
                            "sub_tasks": []
                        }
                        rubric["tasks"].append(task_entry)
                    
                    task_entry["sub_tasks"].append({
                        "sub_task_id": sub_task,
                        "description": description,
                        "marks": float(marks)
                    })
        
        # Output JSON
        with open('Assignment_2_Rubric.json', 'w', encoding='utf-8') as f:
            json.dump(rubric, f, indent=4)
            
        print("Successfully converted to Assignment_2_Rubric.json")
        
    except Exception as e:
        print(f"Error converting docx to json: {e}")

if __name__ == '__main__':
    convert_docx_to_json()
