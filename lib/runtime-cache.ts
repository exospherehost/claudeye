/**
 * Simple in-memory cache with TTL, used instead of Next.js `unstable_cache`.
 *
 * Next.js Data Cache writes results to .next/cache at build time and
 * re-serves them indefinitely unless explicitly revalidated. Since our
 * data comes from local JSONL files that change outside of Next.js,
 * those stale build-time entries cause ghost data on first load.
 *
 * This in-process Map-based cache avoids that problem: entries expire
 * after `revalidateSeconds` and are never persisted to disk.
 */
export function runtimeCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  revalidateSeconds: number
): (...args: TArgs) => Promise<TResult> {
  const cache = new Map<string, { data: TResult; expiry: number }>();

  return async (...args: TArgs): Promise<TResult> => {
    const key = JSON.stringify(args);
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    const data = await fn(...args);
    cache.set(key, { data, expiry: Date.now() + revalidateSeconds * 1000 });
    return data;
  };
}
