const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  current_storage_mb?: number;
  subscription_id?: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Login failed");
  }

  return res.json();
}

export async function registerUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Registration failed");
  }

  return res.json();
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const res = await fetch(
    `${API_URL}/api/auth/me?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) {
    throw new Error("Session expired");
  }

  return res.json();
}

export async function logoutUser(accessToken: string): Promise<void> {
  await fetch(
    `${API_URL}/api/auth/logout?access_token=${encodeURIComponent(accessToken)}`,
    { method: "POST" }
  );
}
