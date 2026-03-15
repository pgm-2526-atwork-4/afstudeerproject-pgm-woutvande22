import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from dependencies import get_supabase, safe_maybe_single
from supabase_auth.errors import AuthApiError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])
DEFAULT_STORAGE_LIMIT_MB = 10240


# Schemas

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    email: EmailStr
    name: Optional[str] = None
    current_storage_mb: float = 0
    subscription_id: Optional[int] = None
    created_at: Optional[str] = None
    storage_limit_mb: float = DEFAULT_STORAGE_LIMIT_MB

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserProfileResponse

class UpdateProfileRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


def _get_authenticated_user(supabase, access_token: str):
    try:
        user_response = supabase.auth.get_user(access_token)
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user = user_response.user
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    supabase.postgrest.auth(access_token)
    return user


def _get_storage_limit_mb(supabase, subscription_id: Optional[int]) -> float:
    if not subscription_id:
        return float(DEFAULT_STORAGE_LIMIT_MB)

    try:
        subscription = safe_maybe_single(
            supabase.table("subscriptions")
            .select("storage_limit_mb")
            .eq("id", subscription_id)
        )
    except Exception as e:
        logger.error(f"Failed to fetch subscription storage limit: {e}")
        return float(DEFAULT_STORAGE_LIMIT_MB)

    if not subscription.data:
        return float(DEFAULT_STORAGE_LIMIT_MB)

    return float(subscription.data.get("storage_limit_mb") or DEFAULT_STORAGE_LIMIT_MB)


def _build_profile_response(supabase, profile_data: Optional[dict], auth_user) -> UserProfileResponse:
    profile = dict(profile_data or {})

    if not profile.get("id"):
        profile["id"] = auth_user.id
    if not profile.get("email"):
        profile["email"] = auth_user.email

    profile["current_storage_mb"] = float(profile.get("current_storage_mb") or 0)
    profile["storage_limit_mb"] = _get_storage_limit_mb(
        supabase,
        profile.get("subscription_id"),
    )

    return UserProfileResponse.model_validate(profile)


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

    user_payload = UserProfileResponse(
        id=user.id,
        email=body.email,
        name=full_name,
        current_storage_mb=0,
        storage_limit_mb=float(DEFAULT_STORAGE_LIMIT_MB),
    )

    if not session:
        # Email confirmation is enabled – user must verify first
        return AuthResponse(
            access_token="",
            refresh_token="",
            user=user_payload,
        )

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user=user_payload,
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
    profile = safe_maybe_single(supabase.table("users").select("*").eq("id", user.id))

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user=_build_profile_response(supabase, profile.data, user),
    )


#  Get current user (from token) 

@router.get("/me", response_model=UserProfileResponse)
def get_current_user(access_token: str = Query(...)):
    """Return the current user based on their access token."""
    supabase = get_supabase()
    user = _get_authenticated_user(supabase, access_token)

    profile = safe_maybe_single(supabase.table("users").select("*").eq("id", user.id))
    return _build_profile_response(supabase, profile.data, user)


@router.patch("/me", response_model=UserProfileResponse)
def update_current_user(body: UpdateProfileRequest, access_token: str = Query(...)):
    """Update the current user's profile in the public users table."""
    supabase = get_supabase()
    user = _get_authenticated_user(supabase, access_token)

    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    profile = safe_maybe_single(supabase.table("users").select("*").eq("id", user.id))

    try:
        if profile.data:
            supabase.table("users").update({"name": name}).eq("id", user.id).execute()
        else:
            supabase.table("users").insert({
                "id": user.id,
                "name": name,
                "email": user.email,
                "current_storage_mb": 0,
            }).execute()
    except Exception as e:
        logger.error(f"Failed to update user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

    updated_profile = safe_maybe_single(supabase.table("users").select("*").eq("id", user.id))
    return _build_profile_response(supabase, updated_profile.data, user)


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
