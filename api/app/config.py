# Plan limits configuration
PLAN_LIMITS = {
    "guest": {
        "max_rows": 200000,
        "max_file_size_mb": 100,
        "retention_hours": 1
    },
    "free": {
        "max_rows": 500000,
        "max_file_size_mb": 250,
        "retention_hours": 168 # 7 days
    },
    "pro": {
        "max_rows": 2000000,
        "max_file_size_mb": 500,
        "retention_hours": 720
    }
}