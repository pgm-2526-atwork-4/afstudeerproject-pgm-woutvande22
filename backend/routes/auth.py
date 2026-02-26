import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from dependencies import get_supabase
from supabase_auth.errors import AuthApiError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# Schemas

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


#  Register 

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest):
    """Register a new user with Supabase Auth and create a profile row."""
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "first_name": body.first_name,
                    "last_name": body.last_name,
                }
            }
        })
    except AuthApiError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = auth_response.user
    session = auth_response.session

    if not user:
        raise HTTPException(status_code=400, detail="Registration failed")

    # Create a row in the public.users table
    full_name = f"{body.first_name} {body.last_name}"
    try:
        supabase.table("users").insert({
            "id": user.id,
            "name": full_name,
            "email": body.email,
            "current_storage_mb": 0,
        }).execute()
    except Exception as e:
        logger.error(f"Failed to create user profile: {e}")

    if not session:
        # Email confirmation is enabled – user must verify first
        return AuthResponse(
            access_token="",
            refresh_token="",
            user={"id": user.id, "email": body.email, "name": full_name,
                  "message": "Check your email to confirm your account."},
        )

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user={"id": user.id, "email": body.email, "name": full_name},
    )


# Login 

@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    """Sign in with email and password."""
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=str(e))

    session = auth_response.session
    user = auth_response.user

    if not session or not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Fetch the profile from public.users
    profile = supabase.table("users").select("*").eq("id", user.id).maybe_single().execute()

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user=profile.data if profile.data else {"id": user.id, "email": body.email},
    )


#  Get current user (from token) 

@router.get("/me")
def get_current_user(access_token: str):
    """Return the current user based on their access token."""
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(access_token)
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    profile = supabase.table("users").select("*").eq("id", user.id).maybe_single().execute()
    return profile.data if profile.data else {"id": user.id, "email": user.email}


# Logout 

@router.post("/logout", status_code=204)
def logout(access_token: str):
    """Sign out the user (invalidate the session on Supabase)."""
    supabase = get_supabase()
    # Set the session so Supabase knows which user to sign out
    try:
        supabase.auth.sign_out(access_token)
    except AuthApiError:
        pass  # Already signed out or invalid token — that's fine
