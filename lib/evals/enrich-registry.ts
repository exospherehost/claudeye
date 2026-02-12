/**
 * Module-level singleton enricher registry backed by globalThis.
 * Uses the shared createScopedRegistry factory for scope filtering logic.
 */
import { createScopedRegistry } from "./create-registry";
import type { ConditionFunction, EvalScope } from "./types";
import type { EnrichFunction, RegisteredEnricher } from "./enrich-types";

const registry = createScopedRegistry<RegisteredEnricher>("__CLAUDEYE_ENRICHER_REGISTRY__");

export function registerEnricher(
  name: string,
  fn: EnrichFunction,
  condition?: ConditionFunction,
  scope: EvalScope = 'session',
  subagentType?: string,
): void {
  const entry: RegisteredEnricher = { name, fn, scope };
  if (condition) entry.condition = condition;
  if (subagentType) entry.subagentType = subagentType;
  registry.register(entry);
}

export const getRegisteredEnrichers = registry.getAll;
export const getSessionScopedEnrichers = registry.getSessionScoped;
export const getSubagentScopedEnrichers = registry.getSubagentScoped;
export const hasSubagentEnrichers = registry.hasSubagent;
export const hasEnrichers = registry.has;
export const clearEnrichers = registry.clear;
