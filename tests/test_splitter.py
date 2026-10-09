import os
import pytest
import pandas as pd
from worker.splitter.modes import split_by_pieces, split_by_rows
from worker.splitter.reader import read_file_preview

@pytest.fixture
def sample_csv(tmp_path):
    d = tmp_path / "sub"
    d.mkdir()
    file_path = d / "test_200k.csv"
    
    # Create sample dataframe with 1,000 rows for testing
    df = pd.DataFrame({
        "ID": range(1, 1001),
        "Name": [f"User_{i}" for i in range(1, 1001)],
        "Value": [i * 1.5 for i in range(1, 1001)]
    })
    df.to_csv(file_path, index=False)
    return str(file_path)

def test_preview(sample_csv):
    preview = read_file_preview(sample_csv, nrows=10)
    assert preview["total_rows"] == 1000
    assert "ID" in preview["columns"]
    assert len(preview["preview_rows"]) == 10

def test_split_by_pieces(sample_csv, tmp_path):
    output_dir = tmp_path / "outputs"
    output_dir.mkdir()
    
    pieces = split_by_pieces(sample_csv, num_pieces=4, output_dir=str(output_dir), output_format="csv")
    assert len(pieces) == 4
    
    total_split_rows = sum(p["rows"] for p in pieces)
    assert total_split_rows == 1000
    
    # Verify header row is present in each piece
    for p in pieces:
        p_df = pd.read_csv(p["path"])
        assert list(p_df.columns) == ["ID", "Name", "Value"]