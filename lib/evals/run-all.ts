/**
 * Generic runner that powers eval, enrichment, and dashboard filter execution.
 *
 * All three systems share the same control flow:
 *   1. Check global condition — if false, skip everything
 *   2. For each item, check per-item condition — if false, skip that item
 *   3. Execute the item's function, measure duration
 *   4. Collect results via Promise.allSettled (one failure never blocks others)
 *   5. Build a typed summary from the results
 *
 * The only differences between eval/enrichment/filter are the result shapes
 * (pass/score vs data vs value) and summary aggregation. Those are abstracted
 * via the `RunCallbacks` interface so each runner is just a thin wrapper.
 */
import { getGlobalCondition } from "./condition-registry";
import type { EvalContext, ConditionFunction } from "./types";

/** Minimum shape of an item that can be run. */
export interface RunnableItem {
  name: string;
  fn: (ctx: EvalContext) => unknown | Promise<unknown>;
  condition?: ConditionFunction;
}

/** Callbacks that define how to build results and summaries for a specific domain. */
export interface RunCallbacks<TItem extends RunnableItem, TResult, TSummary> {
  /** Result when an item is skipped (global or per-item condition). */
  skipResult(item: TItem): TResult;
  /** Result on successful execution. */
  successResult(item: TItem, fnResult: unknown, durationMs: number): TResult;
  /** Result when execution throws. */
  errorResult(item: TItem, error: string, durationMs: number): TResult;
  /** Fallback result for unexpected Promise.allSettled rejections. */
  unexpectedResult(): TResult;
  /** Aggregate individual results into a domain-specific summary. */
  buildSummary(results: TResult[], totalDurationMs: number): TSummary;
}

export async function runAll<TItem extends RunnableItem, TResult, TSummary>(
  items: TItem[],
  context: EvalContext,
  callbacks: RunCallbacks<TItem, TResult, TSummary>,
): Promise<TSummary> {
  const results: TResult[] = [];
  const overallStart = performance.now();

  // Check global condition first
  const globalCondition = getGlobalCondition();
  let globalSkip = false;
  if (globalCondition) {
    try {
      const result = await globalCondition(context);
      if (!result) globalSkip = true;
    } catch {
      globalSkip = true;
    }
  }

  if (globalSkip) {
    for (const item of items) {
      results.push(callbacks.skipResult(item));
    }
  } else {
    const promises = items.map(async (item): Promise<TResult> => {
      // Check per-item condition
      if (item.condition) {
        try {
          const shouldRun = await item.condition(context);
          if (!shouldRun) {
            return callbacks.skipResult(item);
          }
        } catch (err) {
          return callbacks.errorResult(
            item,
            `Condition error: ${err instanceof Error ? err.message : String(err)}`,
            0,
          );
        }
      }

      const start = performance.now();
      try {
        const fnResult = await item.fn(context);
        const durationMs = Math.round(performance.now() - start);
        return callbacks.successResult(item, fnResult, durationMs);
      } catch (err) {
        const durationMs = Math.round(performance.now() - start);
        return callbacks.errorResult(
          item,
          err instanceof Error ? err.message : String(err),
          durationMs,
        );
      }
    });

    const settled = await Promise.allSettled(promises);
    for (const s of settled) {
      results.push(
        s.status === 'fulfilled' ? s.value : callbacks.unexpectedResult(),
      );
    }
  }

  const totalDurationMs = Math.round(performance.now() - overallStart);
  return callbacks.buildSummary(results, totalDurationMs);
}
