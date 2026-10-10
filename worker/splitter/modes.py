import os
import pandas as pd
from .writer import write_piece

def split_by_pieces(input_path: str, num_pieces: int, output_dir: str, output_format: str = 'csv', remove_duplicates: bool = False):
    """Splits file into N pieces evenly, repeating header row, with optional deduplication."""
    ext = os.path.splitext(input_path)[1].lower()
    output_files = []
    
    if ext == '.csv':
        df = pd.read_csv(input_path)
    else:
        df = pd.read_excel(input_path)
        
    if remove_duplicates:
        df = df.drop_duplicates()
        
    total_rows = len(df)
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    
    chunk_size = total_rows // num_pieces
    remainder = total_rows % num_pieces
    
    start_idx = 0
    for i in range(num_pieces):
        current_chunk_size = chunk_size + (1 if i < remainder else 0)
        if current_chunk_size == 0:
            continue
        end_idx = start_idx + current_chunk_size
        piece_df = df.iloc[start_idx:end_idx]
        
        out_filename = f"{base_name}_part{i+1}.{output_format}"
        out_path = os.path.join(output_dir, out_filename)
        
        write_piece(piece_df, list(df.columns), out_path, output_format)
        output_files.append({
            "name": out_filename,
            "rows": len(piece_df),
            "sizeBytes": os.path.getsize(out_path),
            "path": out_path
        })
        start_idx = end_idx
        
    return output_files

def split_by_rows(input_path: str, rows_per_file: int, output_dir: str, output_format: str = 'csv', remove_duplicates: bool = False):
    """Splits large files into fixed chunks of R rows each (e.g., 50k rows per file)."""
    ext = os.path.splitext(input_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(input_path)
    else:
        df = pd.read_excel(input_path)
        
    if remove_duplicates:
        df = df.drop_duplicates()
        
    total_rows = len(df)
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    output_files = []
    
    part_num = 1
    for start_idx in range(0, total_rows, rows_per_file):
        end_idx = min(start_idx + rows_per_file, total_rows)
        piece_df = df.iloc[start_idx:end_idx]
        
        out_filename = f"{base_name}_rowpart{part_num}.{output_format}"
        out_path = os.path.join(output_dir, out_filename)
        
        write_piece(piece_df, list(df.columns), out_path, output_format)
        output_files.append({
            "name": out_filename,
            "rows": len(piece_df),
            "sizeBytes": os.path.getsize(out_path),
            "path": out_path
        })
        part_num += 1
        
    return output_files

def split_by_column(input_path: str, column_name: str, output_dir: str, output_format: str = 'csv', remove_duplicates: bool = False):
    """Smart Split: Groups rows by unique values in a specified column and writes separate files."""
    ext = os.path.splitext(input_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(input_path)
    else:
        df = pd.read_excel(input_path)
        
    if remove_duplicates:
        df = df.drop_duplicates()
        
    if column_name not in df.columns:
        raise ValueError(f"Column '{column_name}' not found in file headers.")
        
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    output_files = []
    
    grouped = df.groupby(column_name)
    for val, group_df in grouped:
        safe_val = str(val).replace("/", "-").replace("\\", "-").strip()
        out_filename = f"{base_name}_{column_name}_{safe_val}.{output_format}"
        out_path = os.path.join(output_dir, out_filename)
        
        write_piece(group_df, list(df.columns), out_path, output_format)
        output_files.append({
            "name": out_filename,
            "rows": len(group_df),
            "sizeBytes": os.path.getsize(out_path),
            "path": out_path
        })
        
    return output_files