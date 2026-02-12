/**
 * Edge-compatible cookie signing / verification using Web Crypto API.
 * Works in both Next.js Edge middleware and Node.js server actions.
 *
 * Cookie format: <base64url(payload)>.<base64url(hmac)>
 * Payload JSON: { u: "username", e: <expiry-ms> }
 */

import type { AuthUser } from "./evals/auth-registry";

const COOKIE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createSessionCookie(username: string, secret: string): Promise<string> {
  const payload = JSON.stringify({ u: username, e: Date.now() + COOKIE_TTL_MS });
  const payloadBytes = new TextEncoder().encode(payload);
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${toBase64Url(payloadBytes.buffer as ArrayBuffer)}.${toBase64Url(sig)}`;
}

export async function verifySessionCookie(cookie: string, secret: string): Promise<string | null> {
  const dotIdx = cookie.indexOf(".");
  if (dotIdx < 0) return null;

  try {
    const payloadB64 = cookie.slice(0, dotIdx);
    const sigB64 = cookie.slice(dotIdx + 1);

    const payloadBytes = fromBase64Url(payloadB64);
    const sigBytes = fromBase64Url(sigB64);

    const key = await getKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, payloadBytes.buffer as ArrayBuffer);
    if (!valid) return null;

    const { u, e } = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (typeof e !== "number" || Date.now() > e) return null;
    return typeof u === "string" ? u : null;
  } catch {
    return null;
  }
}

export function parseAuthUsers(raw: string): AuthUser[] {
  if (!raw.trim()) return [];
  return raw.split(",").reduce<AuthUser[]>((acc, entry) => {
    const colonIdx = entry.indexOf(":");
    if (colonIdx > 0) {
      acc.push({ username: entry.slice(0, colonIdx), password: entry.slice(colonIdx + 1) });
    }
    return acc;
  }, []);
}
