import os
import json
import glob
import pandas as pd
import re

import time
import subprocess

# Configuration
STUDENT_DIRS = ["4473"]
QUESTIONS_FILE = "Assignment_2_Questions.json"
RUBRIC_FILE = "Assignment_2_Rubric.json"
SYSTEM_PROMPT_FILE = "system_prompt.md"
OUTPUT_FILE = "grading_report.csv"

import google.generativeai as genai
from dotenv import load_dotenv

# Configuration
load_dotenv()
# STUDENT_DIRS duplicates removed, using the one above or confirming below.
# Actually, let's keep the structure but update the value.
STUDENT_DIRS = ["4473"]
QUESTIONS_FILE = "Assignment_2_Questions.json"
RUBRIC_FILE = "Assignment_2_Rubric.json"
SYSTEM_PROMPT_FILE = "system_prompt.md"
OUTPUT_FILE = "grading_report.csv"
CONVERT_SCRIPT = "convert-ipynb-to-pdf.js"

# Debug/Test Configuration
# TEST_STUDENT_FILENAME = "2806832817 - Martin Peng - 2744791_Martin_Peng_z5580411_8279939_2111805061.ipynb"
TEST_STUDENT_FILENAME = None  # Set to None to process all students


def configure_gemini():
    """Configures the Gemini API with the key from environment variables."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment variables (.env).")
        return False
    
    try:
        genai.configure(api_key=api_key)
        return True
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        return False

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_system_prompt():
    if os.path.exists(SYSTEM_PROMPT_FILE):
        with open(SYSTEM_PROMPT_FILE, 'r', encoding='utf-8') as f:
            return f.read()
    return "You are a helpful grader."

def convert_ipynb_to_pdf(ipynb_path):
    """
    Converts .ipynb to .pdf using the Node.js script.
    Returns the path to the generated PDF or None if failed.
    """
    pdf_path = ipynb_path.replace(".ipynb", ".pdf")
    
    # If using the provided script which requires absolute paths or careful handling
    script_path = os.path.abspath(CONVERT_SCRIPT)
    
    if not os.path.exists(script_path):
        print(f"Error: Conversion script not found at {script_path}")
        return None

    try:
        # Call node convert-ipynb-to-pdf.js <input> <output>
        cmd = ["node", script_path, ipynb_path, pdf_path]
        subprocess.run(cmd, check=True, capture_output=True)
        if os.path.exists(pdf_path):
            return pdf_path
    except subprocess.CalledProcessError as e:
        print(f"PDF Conversion failed for {ipynb_path}: {e.stderr.decode()}")
    except Exception as e:
        print(f"PDF Conversion error: {e}")
    
    return None

def upload_to_gemini(file_path, mime_type="application/pdf"):
    """Uploads a file to Gemini and waits for it to be active."""
    try:
        file = genai.upload_file(file_path, mime_type=mime_type)
        print(f"   -> Uploaded {file.display_name} to Gemini ({file.uri})")
        
        # Wait for processing
        while file.state.name == "PROCESSING":
            print("   -> Waiting for file processing...")
            time.sleep(2)
            file = genai.get_file(file.name)
            
        if file.state.name != "ACTIVE":
            print(f"   -> File processing failed: {file.state.name}")
            return None
            
        return file
    except Exception as e:
        print(f"Gemini Upload Error: {e}")
        return None

def call_gemini(prompt, system_instruction, attachment=None):
    """
    Calls Google Gemini API.
    supports optional attachment (File object).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-pro")
    
    if not api_key:
        return {
            "marks_awarded": 0,
            "max_marks": 0,
            "feedback": "GEMINI_API_KEY not found in .env",
            "issues": ["Config Error"]
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name,
            system_instruction=system_instruction,
            generation_config={"response_mime_type": "application/json"}
        )
        
        content = [prompt]
        if attachment:
            content.append(attachment)
            
        response = model.generate_content(content)
        
        # Debug: Print raw response
        print(f"\n[DEBUG] Raw Gemini Response:\n{response.text}\n")

        # Gemini returns a JSON string due to response_mime_type
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "marks_awarded": 0,
            "max_marks": 0,
            "feedback": f"API Call Failed: {str(e)}",
            "issues": ["API Error"]
        }

def mock_llm_call(prompt):
    # This function is replaced by call_gemini, but kept for structure compatibility if needed
    # We will reroute the logic in the main loop
    pass

def extract_code_from_notebook(file_path, task_signatures):
    """
    Extracts code cells based on function signatures or patterns.
    Also returns the full notebook content as a string for context/report tasks.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            nb = json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return {}, ""

    extracted_tasks = {}
    full_content_lines = []
    
    for cell in nb['cells']:
        cell_type = cell['cell_type']
        source = ''.join(cell['source'])
        
        # Add to full content
        full_content_lines.append(f"--- [{cell_type.upper()} CELL] ---")
        full_content_lines.append(source)
        full_content_lines.append("")
        
        # Extract specific tasks from code cells
        if cell_type == 'code':
            for task_id, signature in task_signatures.items():
                if signature in source:
                    if task_id not in extracted_tasks:
                        extracted_tasks[task_id] = source
                        
    return extracted_tasks, "\n".join(full_content_lines)

def generate_bulk_prompt(questions, rubric, extracted_tasks, full_notebook_content, is_pdf_available):
    """
    Constructs a single prompt for all tasks.
    """
    prompt = "--- BATCH EVALUATION ---\n"
    prompt += "You are required to evaluate ALL tasks in the rubric below based on the provided student submission.\n"
    prompt += "For tasks requiring code (Task 1 & 2), look at the EXTRACTED CODE SECTIONS.\n"
    prompt += "For tasks requiring report/plots (Task 3), look at the FULL NOTEBOOK CONTENT (or attached PDF).\n\n"
    
    prompt += "RUBRIC:\n" + json.dumps(rubric, indent=2) + "\n\n"
    
    prompt += "--- EXTRACTED CODE SECTIONS ---\n"
    for task_id, code in extracted_tasks.items():
        prompt += f"Task {task_id} Code:\n```python\n{code}\n```\n\n"
        
    if not is_pdf_available:
        prompt += "--- FULL NOTEBOOK CONTENT ---\n"
        prompt += full_notebook_content + "\n\n"
    else:
        prompt += "--- FULL NOTEBOOK CONTENT ---\n"
        prompt += "[SYSTEM]: The student's full notebook is attached as a PDF. Please refer to it for all plots and analysis tasks.\n\n"

    prompt += "INSTRUCTION: Return a JSON object with a key 'results' containing a list of evaluations for every task_id in the rubric.\n"
    prompt += "Format:\n"
    prompt += "{\n  \"results\": [\n    {\n      \"task_id\": \"1.1\",\n      \"marks_awarded\": 1.0,\n      \"max_marks\": 1.0,\n      \"feedback\": \"Correct.\",\n      \"issues\": []\n    },\n    ...\n  ]\n}"
    
    return prompt


import csv

def initialize_csv(filename, headers):
    """Initializes the CSV file with headers if it doesn't exist."""
    if not os.path.exists(filename):
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers)

def append_to_csv(filename, data_dict, headers):
    """Appends a single student's result to the CSV."""
    with open(filename, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writerow(data_dict)

def main():
    print("--- Phase 1: Preparation ---")
    
    # Configure Gemini first
    if not configure_gemini():
        return

    print("Loading Assignment Context...")
    questions = load_json(QUESTIONS_FILE)
    rubric = load_json(RUBRIC_FILE)
    system_prompt_template = load_system_prompt()
    
    print(f"Loaded {len(questions.get('tasks', []))} Tasks from Questions.")
    print(f"Loaded Rubric with {len(rubric.get('tasks', []))} Task Groups.")

    # Define signatures to look for
    task_signatures = {
        "1.1": "def missing_data",
        "1.2": "def encoding",
        "1.3": "def rescale",
        "2.1": "def train_shallow_net_class",
        "2.2": "def train_classification_tree"
    }
    
    # Prepare CSV Headers
    # We need to know all possible columns. 
    # Structure: Student, Total Marks, Overall Feedback, [Task X Marks, Task X Feedback...]
    headers = ["Student", "Total Marks", "Overall Feedback"]
    for task_group in rubric.get("tasks", []):
        for sub_task in task_group.get("sub_tasks", []):
            t_id = sub_task["sub_task_id"]
            headers.append(f"Task {t_id} Marks")
            # We can optionally add specific feedback columns back if needed, 
            # but the user liked the summary. Let's keep it simple for now.
    
    initialize_csv(OUTPUT_FILE, headers)
    print(f"Initialized {OUTPUT_FILE}")

    print("\n--- Phase 2: Evaluation & Appending ---")
    
    student_files = []
    for d in STUDENT_DIRS:
        path = os.path.join(os.getcwd(), d)
        if os.path.exists(path):
            # Support ipynb (and theoretically pdf if we had a text extractor)
            files = glob.glob(os.path.join(path, "*.ipynb"))
            student_files.extend(files)
    
    print(f"Found {len(student_files)} submissions.")
    
    for i, file_path in enumerate(student_files):
        filename = os.path.basename(file_path)
        
        # Filter for test student if configured
        if TEST_STUDENT_FILENAME and filename != TEST_STUDENT_FILENAME:
            continue

        print(f"Processing ({i+1}/{len(student_files)}): {filename}")
        
        # 1. Convert to PDF
        pdf_path = convert_ipynb_to_pdf(file_path)
        gemini_file = None
        if pdf_path:
            # 2. Upload to Gemini
            gemini_file = upload_to_gemini(pdf_path)
        else:
            print("   -> PDF Conversion failed. Proceeding with text-only evaluation.")

        try:
            extracted_tasks, full_notebook_content = extract_code_from_notebook(file_path, task_signatures)
        except Exception as e:
            print(f"Skipping {filename}: Error extracting code - {e}")
            if gemini_file:
                genai.delete_file(gemini_file.name)
            continue
        
        # Evaluate all tasks in one go
        student_results = {"Student": filename, "Total Marks": 0}
        deductions = []

        # Initialize default marks for all tasks
        all_task_ids = []
        for task_group in rubric.get("tasks", []):
            for sub_task in task_group.get("sub_tasks", []):
                t_id = sub_task["sub_task_id"]
                all_task_ids.append(t_id)
                student_results[f"Task {t_id} Marks"] = 0

        # Generate Bulk Prompt
        prompt = generate_bulk_prompt(questions, rubric, extracted_tasks, full_notebook_content, is_pdf_available=(gemini_file is not None))
        
        print(f"   -> Calling Gemini for Batch Evaluation...")
        evaluation_response = call_gemini(prompt, system_prompt_template, attachment=gemini_file)
        
        if isinstance(evaluation_response, list):
            results_list = evaluation_response
        else:
            results_list = evaluation_response.get("results", [])
        
        # Map results back to student_results
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
                print(f"   -> Warning: Gemini returned unknown task_id {t_id}")

        # Handle missing evaluations (if Gemini skipped some)
        evaluated_ids = [r.get("task_id") for r in results_list]
        for t_id in all_task_ids:
            if t_id not in evaluated_ids:
                deductions.append(f"Task {t_id}: Not evaluated by AI (Error).")
        
        # Cleanup Gemini File
        if gemini_file:
            try:
                genai.delete_file(gemini_file.name)
                print(f"   -> Deleted Gemini file {gemini_file.name}")
            except Exception as e:
                print(f"   -> Warning: Failed to delete Gemini file: {e}")
        
        # Cleanup Local PDF (Optional, but good for space)
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)

        # Generate Overall Feedback
        if not deductions:
            student_results["Overall Feedback"] = "Excellent work! Full marks on auto-graded tasks."
        else:
            student_results["Overall Feedback"] = " | ".join(deductions)
        
        # Append to CSV immediately
        append_to_csv(OUTPUT_FILE, student_results, headers)
        print(f"   -> Saved result for {filename}")
    
    print(f"\nGrading complete. All results in {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
