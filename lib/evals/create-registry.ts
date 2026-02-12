/**
 * Factory for creating scoped registries backed by globalThis.
 *
 * Using globalThis as the backing store ensures the registry survives
 * webpack chunk splitting and Next.js hot reloading — it remains a true
 * singleton even when the module is imported from different bundles.
 *
 * Both the eval registry and enricher registry share the exact same
 * structure (register, getAll, getSessionScoped, getSubagentScoped, etc.)
 * so this factory eliminates that duplication.
 */
import type { EvalScope } from "./types";

/** Minimum shape of a registry item that supports scope filtering. */
export interface ScopedRegistryItem {
  name: string;
  scope: EvalScope;
  subagentType?: string;
}

export function createScopedRegistry<T extends ScopedRegistryItem>(key: string) {
  function getRegistry(): T[] {
    const g = globalThis as unknown as Record<string, T[] | undefined>;
    if (!g[key]) {
      g[key] = [];
    }
    return g[key]!;
  }

  return {
    register(entry: T): void {
      const registry = getRegistry();
      const idx = registry.findIndex((e) => e.name === entry.name);
      if (idx >= 0) {
        registry[idx] = entry;
      } else {
        registry.push(entry);
      }
    },

    getAll(): T[] {
      return getRegistry();
    },

    getSessionScoped(): T[] {
      return getRegistry().filter((e) => e.scope === 'session' || e.scope === 'both');
    },

    getSubagentScoped(subagentType?: string): T[] {
      return getRegistry().filter((e) => {
        if (e.scope !== 'subagent' && e.scope !== 'both') return false;
        if (e.subagentType && subagentType && e.subagentType !== subagentType) return false;
        return true;
      });
    },

    hasSubagent(): boolean {
      return getRegistry().some((e) => e.scope === 'subagent' || e.scope === 'both');
    },

    has(): boolean {
      return getRegistry().length > 0;
    },

    clear(): void {
      const g = globalThis as unknown as Record<string, T[] | undefined>;
      g[key] = [];
    },
  };
}
