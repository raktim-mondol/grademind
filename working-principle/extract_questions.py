import json

try:
    with open('Assignment_2.ipynb', 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    for cell in nb['cells']:
        if cell['cell_type'] == 'markdown':
            content = ''.join(cell['source'])
            if "Task" in content:
                print("-" * 80)
                print(content)
                print("-" * 80)
except Exception as e:
    print(f"Error: {e}")
