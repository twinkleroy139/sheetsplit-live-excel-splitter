import os
import json
from pathlib import Path
from fastapi import Header, HTTPException, status
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from api.app.config import ADMIN_EMAIL

# Initialize Firebase Admin SDK safely
cred_file = Path(__file__).resolve().parent.parent / "firebase_service_account.json"
cred_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

if not firebase_admin._apps:
    try:
        if cred_env:
            cred_dict = json.loads(cred_env)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        elif cred_file.exists():
            cred = credentials.Certificate(str(cred_file))
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    except Exception as e:
        print(f"Warning: Firebase Admin failed to initialize: {e}")

def get_current_user_optional(authorization: str = Header(None)):
    """Extracts user info if token is provided; defaults to guest if missing."""
    if not authorization or not authorization.startswith("Bearer "):
        return {"uid": "guest", "email": None, "role": "guest"}
    
    token = authorization.split("Bearer ")[1].strip()
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        user_email = decoded_token.get("email")
        role = "admin" if user_email == ADMIN_EMAIL else "user"
        return {
            "uid": decoded_token.get("uid"),
            "email": user_email,
            "role": role,
            "name": decoded_token.get("name")
        }
    except Exception:
        return {"uid": "guest", "email": None, "role": "guest"}

def require_admin(authorization: str = Header(...)):
    """Enforces that the requester must be the verified Admin."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer authentication token."
        )
    
    token = authorization.split("Bearer ")[1].strip()
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        user_email = decoded_token.get("email")
        if user_email != ADMIN_EMAIL:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admin rights required."
            )
        return decoded_token
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )