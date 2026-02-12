"use server";

import { cookies } from "next/headers";
import { createSessionCookie, parseAuthUsers } from "@/lib/auth";

export async function login(formData: FormData): Promise<{ error?: string; redirectTo?: string }> {
  const username = formData.get("username") as string | null;
  const password = formData.get("password") as string | null;
  const redirectTo = (formData.get("redirectTo") as string | null) || "/";

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  const raw = process.env.CLAUDEYE_AUTH_USERS ?? "";
  const users = parseAuthUsers(raw);

  // Constant-time-ish comparison: always check all users to avoid timing leaks
  let matched = false;
  for (const user of users) {
    const usernameMatch = timingSafeEqual(user.username, username);
    const passwordMatch = timingSafeEqual(user.password, password);
    if (usernameMatch && passwordMatch) matched = true;
  }

  if (!matched) {
    return { error: "Invalid username or password" };
  }

  const secret = process.env.CLAUDEYE_AUTH_SECRET ?? "";
  const cookieValue = await createSessionCookie(username, secret);

  const cookieStore = await cookies();
  cookieStore.set("claudeye_session", cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  // Set a non-httpOnly flag cookie so client JS can detect auth is active
  cookieStore.set("claudeye_auth", "1", {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return { redirectTo };
}

export async function logout(): Promise<{ redirectTo: string }> {
  const cookieStore = await cookies();
  cookieStore.delete("claudeye_session");
  cookieStore.delete("claudeye_auth");
  return { redirectTo: "/login" };
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison loop to keep timing constant-ish
    let result = 1; // length mismatch
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      result |= (a.charCodeAt(i % a.length) ?? 0) ^ (b.charCodeAt(i % b.length) ?? 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
