/** Boolean filter tile — three-state toggle: all → true-only → false-only → all. */
"use client";

import type { BooleanFilterMeta } from "@/lib/evals/dashboard-types";

export type BooleanFilterState = "all" | "true" | "false";

interface FilterTileBooleanProps {
  meta: BooleanFilterMeta;
  value: BooleanFilterState;
  onChange: (value: BooleanFilterState) => void;
}

const STATES: BooleanFilterState[] = ["all", "true", "false"];

export default function FilterTileBoolean({ meta, value, onChange }: FilterTileBooleanProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <label className="block text-sm font-medium text-foreground mb-2">
        {meta.label}
      </label>
      <div className="flex gap-1">
        {STATES.map((state) => (
          <button
            key={state}
            onClick={() => onChange(state)}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              value === state
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {state === "all" ? "All" : state === "true" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
