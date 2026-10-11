import pandas as pd

def read_file_preview(file_path: str, nrows: int = 20):
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path, nrows=nrows)
    else:
        df = pd.read_excel(file_path, nrows=nrows)
    return {
        "columns": list(df.columns),
        "total_rows_preview": len(df),
        "sample_data": df.head(nrows).to_dict(orient="records")
    }