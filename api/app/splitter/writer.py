import os
import math
import pandas as pd

def split_spreadsheet(file_path: str, output_dir: str, mode: str, mode_value, output_format: str = "csv"):
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.csv':
        df = pd.read_csv(file_path)
    else:
        engine = 'openpyxl' if ext == '.xlsx' else None
        df = pd.read_excel(file_path, engine=engine)

    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    total_rows = len(df)
    generated_files = []

    def export_chunk(chunk_df: pd.DataFrame, file_suffix: str):
        target_ext = output_format.lower()
        target_filename = f"{base_name}_{file_suffix}.{target_ext}"
        target_path = os.path.join(output_dir, target_filename)

        if target_ext == "csv":
            chunk_df.to_csv(target_path, index=False)
        elif target_ext == "xlsx":
            chunk_df.to_excel(target_path, index=False, engine="openpyxl")
        elif target_ext == "tsv":
            chunk_df.to_csv(target_path, sep="\t", index=False)
        elif target_ext == "json":
            chunk_df.to_json(target_path, orient="records", indent=2)
        else:
            chunk_df.to_csv(target_path, index=False)

        generated_files.append(target_path)

    # 1. Split into N equal pieces
    if mode == "pieces":
        num_pieces = max(1, int(mode_value))
        chunk_size = math.ceil(total_rows / num_pieces) if total_rows > 0 else 0
        for i in range(num_pieces):
            start_idx = i * chunk_size
            end_idx = min(start_idx + chunk_size, total_rows)
            chunk = df.iloc[start_idx:end_idx]
            if not chunk.empty or i == 0:
                export_chunk(chunk, f"part{i+1}")

    # 2. Split by fixed row count
    elif mode == "rows":
        rows_per_file = max(1, int(mode_value))
        part_idx = 1
        for i in range(0, total_rows, rows_per_file):
            chunk = df.iloc[i:i + rows_per_file]
            export_chunk(chunk, f"part{part_idx}")
            part_idx += 1

    # 3. Smart split by unique column value
    elif mode == "column":
        col_name = str(mode_value)
        if col_name in df.columns:
            for val, group_df in df.groupby(col_name):
                safe_val = "".join(c for c in str(val) if c.isalnum() or c in (' ', '_', '-')).strip()
                safe_val = safe_val.replace(" ", "_") or "blank"
                export_chunk(group_df, f"by_{col_name}_{safe_val}")
        else:
            # Fallback if column not found
            export_chunk(df, "all")

    return generated_files