import pandas as pd

try:
    df = pd.read_excel('Marks_ass2.xlsx')
    print("Columns:")
    for col in df.columns:
        print(col)
    
    print("\nFirst 5 rows:")
    print(df.head(5).to_string())
except Exception as e:
    print(f"Error: {e}")
