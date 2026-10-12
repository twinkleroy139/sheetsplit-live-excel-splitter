import os
import pandas as pd

def read_file_preview(file_path: str, nrows: int = 20):
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.csv':
        # Get total rows count efficiently
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            total_rows = max(0, sum(1 for _ in f) - 1)
        df_preview = pd.read_csv(file_path, nrows=nrows)
    else:
        # Excel reading (.xlsx, .xls)
        engine = 'openpyxl' if ext == '.xlsx' else None
        df_full = pd.read_excel(file_path, engine=engine)
        total_rows = len(df_full)
        df_preview = df_full.head(nrows)

    # Sanitize nulls and convert preview rows to 2D array expected by dashboard.html
    df_preview = df_preview.fillna("")
    columns = [str(c) for c in df_preview.columns.tolist()]
    preview_rows = df_preview.values.tolist()

    return {
        "columns": columns,
        "total_rows": total_rows,
        "preview_rows": preview_rows
    }