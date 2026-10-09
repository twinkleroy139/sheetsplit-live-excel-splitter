# Plan limits configuration
PLAN_LIMITS = {
    "guest": {
        "max_rows": 50000,
        "max_file_size_mb": 10,
        "retention_hours": 1
    },
    "free": {
        "max_rows": 200000,
        "max_file_size_mb": 50,
        "retention_hours": 168 # 7 days
    },
    "pro": {
        "max_rows": 2000000,
        "max_file_size_mb": 200,
        "retention_hours": 720
    }
}