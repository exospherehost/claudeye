/**
 * Executes all registered filter functions against a session's log entries.
 * Each filter is individually try/caught so one failure doesn't block others.
 */
import { getRegisteredFilters } from "./dashboard-registry";
import { getGlobalCondition } from "./condition-registry";
import type { EvalContext, EvalLogStats } from "./types";
import type { FilterComputeResult, FilterComputeSummary, RegisteredFilter } from "./dashboard-types";

export async function runAllFilters(
  entries: Record<string, unknown>[],
  stats: EvalLogStats,
  projectName: string,
  sessionId: string,
  filtersToRun?: RegisteredFilter[],
): Promise<FilterComputeSummary> {
  const registeredFilters = filtersToRun ?? getRegisteredFilters();
  const results: FilterComputeResult[] = [];
  const overallStart = performance.now();
  const context: EvalContext = { entries, stats, projectName, sessionId, scope: 'session' };

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
    // All filters skipped due to global condition
    for (const { name } of registeredFilters) {
      results.push({
        name,
        value: false,
        durationMs: 0,
        skipped: true,
      });
    }
  } else {
    const promises = registeredFilters.map(async ({ name, fn, condition }): Promise<FilterComputeResult> => {
      // Check per-filter condition
      if (condition) {
        try {
          const shouldRun = await condition(context);
          if (!shouldRun) {
            return { name, value: false, durationMs: 0, skipped: true };
          }
        } catch (err) {
          return {
            name,
            value: false,
            durationMs: 0,
            error: `Condition error: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      }

      const start = performance.now();
      try {
        const value = await fn(context);
        const durationMs = Math.round(performance.now() - start);
        return { name, value, durationMs };
      } catch (err) {
        const durationMs = Math.round(performance.now() - start);
        return {
          name,
          value: false,
          durationMs,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });

    const settled = await Promise.allSettled(promises);
    for (const s of settled) {
      results.push(
        s.status === 'fulfilled'
          ? s.value
          : { name: '?', value: false, durationMs: 0, error: 'Unexpected rejection' },
      );
    }
  }

  const totalDurationMs = Math.round(performance.now() - overallStart);
  let errorCount = 0;
  let skippedCount = 0;
  for (const r of results) {
    if (r.skipped) skippedCount++;
    else if (r.error) errorCount++;
  }

  return { results, totalDurationMs, errorCount, skippedCount };
}
