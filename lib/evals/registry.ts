/**
 * Module-level singleton eval registry backed by globalThis.
 * Uses the shared createScopedRegistry factory for scope filtering logic.
 */
import { createScopedRegistry } from "./create-registry";
import type { ConditionFunction, EvalFunction, EvalScope, RegisteredEval } from "./types";

const registry = createScopedRegistry<RegisteredEval>("__CLAUDEYE_EVAL_REGISTRY__");

export function registerEval(
  name: string,
  fn: EvalFunction,
  condition?: ConditionFunction,
  scope: EvalScope = 'session',
  subagentType?: string,
): void {
  const entry: RegisteredEval = { name, fn, scope };
  if (condition) entry.condition = condition;
  if (subagentType) entry.subagentType = subagentType;
  registry.register(entry);
}

export const getRegisteredEvals = registry.getAll;
export const getSessionScopedEvals = registry.getSessionScoped;
export const getSubagentScopedEvals = registry.getSubagentScoped;
export const hasSubagentEvals = registry.hasSubagent;
export const hasEvals = registry.has;
export const clearEvals = registry.clear;
