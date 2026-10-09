import os
import pandas as pd

def write_piece(chunk_df, header_row, output_path, output_format='csv'):
    """Writes a chunk DataFrame to CSV, XLSX, TSV, or JSON with headers repeated."""
    ext = output_format.lower()
    
    # Escape CSV/TSV formula injection (values starting with =, +, -, @) safely
    if ext in ['csv', 'tsv']:
        for col in chunk_df.columns:
            chunk_df.loc[:, col] = chunk_df[col].apply(
                lambda val: f"'{val}" if isinstance(val, str) and val.startswith(('=', '+', '-', '@')) else val
            )
            
    if ext == 'csv':
        chunk_df.to_csv(output_path, index=False)
    elif ext == 'tsv':
        chunk_df.to_csv(output_path, index=False, sep='\t')
    elif ext == 'xlsx':
        chunk_df.to_excel(output_path, index=False, engine='openpyxl')
    elif ext == 'json':
        chunk_df.to_json(output_path, orient='records', indent=2)
    else:
        raise ValueError("Unsupported output format.")