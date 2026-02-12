/** Dashboard client — orchestrates filter computation and client-side filtering. */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { computeDashboard } from "@/app/actions/compute-dashboard";
import type {
  DashboardPayload,
  DashboardSessionRow,
  FilterMeta,
} from "@/lib/evals/dashboard-types";
import FilterTileBoolean, { type BooleanFilterState } from "./tiles/filter-tile-boolean";
import FilterTileNumber, { type NumberFilterState } from "./tiles/filter-tile-number";
import FilterTileString, { type StringFilterState } from "./tiles/filter-tile-string";
import DashboardSessionsTable from "./dashboard-sessions-table";
import { Loader2 } from "lucide-react";

/** Active filter state — keyed by filter name. */
type ActiveFilters = Record<
  string,
  BooleanFilterState | NumberFilterState | StringFilterState
>;

/** Initialize filter state from filter meta. */
function initializeFilters(meta: FilterMeta[]): ActiveFilters {
  const filters: ActiveFilters = {};
  for (const m of meta) {
    switch (m.type) {
      case "boolean":
        filters[m.name] = "all" as BooleanFilterState;
        break;
      case "number":
        filters[m.name] = { min: m.min, max: m.max } as NumberFilterState;
        break;
      case "string":
        filters[m.name] = new Set(m.values) as StringFilterState;
        break;
    }
  }
  return filters;
}

/** Apply active filters to sessions (client-side filtering). */
function applyFilters(
  sessions: DashboardSessionRow[],
  meta: FilterMeta[],
  filters: ActiveFilters,
): DashboardSessionRow[] {
  return sessions.filter((session) => {
    for (const m of meta) {
      const filterState = filters[m.name];
      const value = session.filterValues[m.name];

      // Sessions without a value for this filter pass through
      if (value === undefined) continue;

      switch (m.type) {
        case "boolean": {
          const state = filterState as BooleanFilterState;
          if (state === "all") continue;
          if (state === "true" && value !== true) return false;
          if (state === "false" && value !== false) return false;
          break;
        }
        case "number": {
          const state = filterState as NumberFilterState;
          const num = value as number;
          if (num < state.min || num > state.max) return false;
          break;
        }
        case "string": {
          const state = filterState as StringFilterState;
          if (state.size > 0 && !state.has(value as string)) return false;
          break;
        }
      }
    }
    return true;
  });
}

export default function DashboardClient({ viewName }: { viewName: string }) {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noFilters, setNoFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await computeDashboard(viewName);
      if (!result.ok) {
        setError(result.error);
      } else if (!result.hasFilters) {
        setNoFilters(true);
      } else {
        setPayload(result.payload);
        setActiveFilters(initializeFilters(result.payload.filterMeta));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [viewName]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = useCallback(
    (name: string, value: BooleanFilterState | NumberFilterState | StringFilterState) => {
      setActiveFilters((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const filteredSessions = useMemo(() => {
    if (!payload) return [];
    return applyFilters(payload.sessions, payload.filterMeta, activeFilters);
  }, [payload, activeFilters]);

  // --- Render states ---

  if (noFilters) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-2">
          No filters are registered for this view.
        </p>
        <p className="text-sm text-muted-foreground">
          Use <code className="text-foreground bg-muted px-1 py-0.5 rounded">app.dashboard.view()</code> or{" "}
          <code className="text-foreground bg-muted px-1 py-0.5 rounded">app.dashboard.filter()</code> in
          your evals file to register filters.
        </p>
      </div>
    );
  }

  if (loading && !payload) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
        <span className="text-muted-foreground">Computing dashboard filters...</span>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive font-medium">Failed to load dashboard</p>
        <p className="text-sm text-destructive/80 mt-1">{error}</p>
        <button
          onClick={load}
          className="mt-3 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!payload) return null;

  return (
    <div className="space-y-6">
      {/* Filter tiles */}
      {payload.filterMeta.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payload.filterMeta.map((meta) => {
            switch (meta.type) {
              case "boolean":
                return (
                  <FilterTileBoolean
                    key={meta.name}
                    meta={meta}
                    value={(activeFilters[meta.name] as BooleanFilterState) ?? "all"}
                    onChange={(v) => updateFilter(meta.name, v)}
                  />
                );
              case "number":
                return (
                  <FilterTileNumber
                    key={meta.name}
                    meta={meta}
                    value={
                      (activeFilters[meta.name] as NumberFilterState) ?? {
                        min: meta.min,
                        max: meta.max,
                      }
                    }
                    onChange={(v) => updateFilter(meta.name, v)}
                  />
                );
              case "string":
                return (
                  <FilterTileString
                    key={meta.name}
                    meta={meta}
                    value={
                      (activeFilters[meta.name] as StringFilterState) ??
                      new Set(meta.values)
                    }
                    onChange={(v) => updateFilter(meta.name, v)}
                  />
                );
            }
          })}
        </div>
      )}

      {/* Timing info */}
      <div className="text-xs text-muted-foreground">
        Computed in {payload.totalDurationMs}ms
      </div>

      {/* Sessions table */}
      <DashboardSessionsTable
        sessions={filteredSessions}
        filterMeta={payload.filterMeta}
        totalCount={payload.sessions.length}
      />
    </div>
  );
}
