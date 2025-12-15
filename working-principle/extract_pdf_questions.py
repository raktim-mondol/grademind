import PyPDF2
import json
import re
import os

def extract_text_from_pdf(pdf_path):
    try:
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            print(f"Number of pages: {len(reader.pages)}")
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return None

def parse_tasks(text):
    lines = text.split('\n')
    tasks = []
    current_task = None
    
    # Regex to match "Task X.Y [Marks] - Title" or variations
    # Handles:
    # Task 1 [2 Marks] - Data preprocessing
    # Task 1.1 [1 Mark] - Missing data removal
    # Task 2 - [3 Marks] Model Training
    # Task 0 - Datasets description
    # Task 3.1 [2 Marks], Preprocessing
    task_pattern = re.compile(r"^Task\s+(\d+(?:\.\d+)?)\s*(?:\[(.*?)\])?\s*[-–,]\s*(?:\[(.*?)\])?\s*(.*)", re.IGNORECASE)
    
    header_info = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = task_pattern.match(line)
        if match:
            # Save previous task
            if current_task:
                tasks.append(current_task)
            
            # Start new task
            task_id = match.group(1)
            marks1 = match.group(2)
            marks2 = match.group(3)
            title = match.group(4)
            
            marks = marks1 if marks1 else (marks2 if marks2 else None)
            
            current_task = {
                "id": task_id,
                "title": title,
                "marks": marks,
                "description": ""
            }
        else:
            if current_task:
                current_task["description"] += line + " "
            else:
                header_info.append(line)
    
    # Append last task
    if current_task:
        tasks.append(current_task)
        
    return header_info, tasks

def structure_json(header_info, tasks):
    # Extract title from header (first few lines)
    title = "Assignment 2"
    subtitle = ""
    if len(header_info) > 1:
        title = header_info[1] # "COMP9414 25T3 - Assignment 2 - Neural"
        if len(header_info) > 2:
            subtitle = header_info[2] # "Networks, Tree-based and Ensemble Methods"
            
    structured_data = {
        "title": title,
        "subtitle": subtitle,
        "header_info": header_info[:10], # Keep top 10 lines as metadata
        "tasks": []
    }
    
    # Build hierarchy
    # Map task_id to task object
    task_map = {}
    
    # First pass: Create all task objects and put top-level tasks in the list
    for task in tasks:
        # Clean description
        task["description"] = task["description"].strip()
        
        # Check if subtask
        if '.' in task["id"]:
            parent_id = task["id"].split('.')[0]
            # We'll handle nesting in second pass, but we need to ensure parent exists or store in a buffer
            # Actually, let's just iterate and place them
            pass
        else:
            # Top level task
            task["subtasks"] = []
            task_map[task["id"]] = task
            structured_data["tasks"].append(task)
            
    # Second pass: Assign subtasks to parents
    for task in tasks:
        if '.' in task["id"]:
            parent_id = task["id"].split('.')[0]
            if parent_id in task_map:
                task_map[parent_id]["subtasks"].append(task)
            else:
                # Parent not found (maybe wasn't parsed correctly or out of order), add to root
                structured_data["tasks"].append(task)
                
    return structured_data

if __name__ == "__main__":
    pdf_path = 'Assignment_2.pdf'
    extracted_text = extract_text_from_pdf(pdf_path)
    
    if extracted_text:
        # Save raw text
        with open('extracted_text_raw.txt', 'w', encoding='utf-8') as f:
            f.write(extracted_text)
            
        # Parse
        header, tasks = parse_tasks(extracted_text)
        json_output = structure_json(header, tasks)
        
        # Save JSON
        with open('Assignment_2_Questions.json', 'w', encoding='utf-8') as f:
            json.dump(json_output, f, indent=4)
            
        print(f"Successfully extracted {len(tasks)} tasks.")
        print("Saved to Assignment_2_Questions.json")
