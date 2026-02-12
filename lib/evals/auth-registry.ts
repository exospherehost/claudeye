/**
 * Module-level singleton auth-user registry backed by globalThis.
 * Stores users configured via app.auth() for later consumption by server-spawn.
 */

export interface AuthUser {
  username: string;
  password: string;
}

const REGISTRY_KEY = "__CLAUDEYE_AUTH_REGISTRY__";

interface GlobalWithAuth {
  [REGISTRY_KEY]?: AuthUser[];
}

export function registerAuthUsers(users: AuthUser[]): void {
  const g = globalThis as GlobalWithAuth;
  if (!g[REGISTRY_KEY]) {
    g[REGISTRY_KEY] = [];
  }
  g[REGISTRY_KEY]!.push(...users);
}

export function getAuthUsers(): AuthUser[] {
  const g = globalThis as GlobalWithAuth;
  return g[REGISTRY_KEY] ?? [];
}

export function clearAuthUsers(): void {
  const g = globalThis as GlobalWithAuth;
  g[REGISTRY_KEY] = [];
}
