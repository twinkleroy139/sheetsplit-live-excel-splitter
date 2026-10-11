import os
import pandas as pd

def split_spreadsheet(file_path: str, output_dir: str, mode: str, chunk_size: int = 1000):
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    
    output_files = []
    total_rows = len(df)
    
    for i in range(0, total_rows, chunk_size):
        chunk = df.iloc[i:i + chunk_size]
        part_num = (i // chunk_size) + 1
        out_path = os.path.join(output_dir, f"{base_name}_part{part_num}.csv")
        chunk.to_csv(out_path, index=False)
        output_files.append(out_path)
        
    return output_files