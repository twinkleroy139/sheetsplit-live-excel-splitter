import os

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "twinkleroy139@gmail.com")  # Replace with your primary Google email

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
        "retention_hours": 720 # 30 days
    }
}