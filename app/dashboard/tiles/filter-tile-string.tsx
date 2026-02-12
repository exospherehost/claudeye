/** String filter tile — multi-select dropdown with checkboxes. */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import type { StringFilterMeta } from "@/lib/evals/dashboard-types";

export type StringFilterState = Set<string>;

interface FilterTileStringProps {
  meta: StringFilterMeta;
  value: StringFilterState;
  onChange: (value: StringFilterState) => void;
}

export default function FilterTileString({ meta, value, onChange }: FilterTileStringProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleValue = useCallback(
    (v: string) => {
      const next = new Set(value);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      onChange(next);
    },
    [value, onChange],
  );

  const selectAll = useCallback(() => {
    onChange(new Set(meta.values));
  }, [meta.values, onChange]);

  const clearAll = useCallback(() => {
    onChange(new Set());
  }, [onChange]);

  const selectedCount = value.size;
  const totalCount = meta.values.length;
  const summaryText =
    selectedCount === 0
      ? "None selected"
      : selectedCount === totalCount
        ? "All selected"
        : `${selectedCount} of ${totalCount} selected`;

  return (
    <div className="bg-card border border-border rounded-lg p-4" ref={containerRef}>
      <label className="block text-sm font-medium text-foreground mb-2">
        {meta.label}
      </label>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground hover:border-primary/50 transition-colors"
        aria-expanded={open}
      >
        <span className="truncate">{summaryText}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 border border-border rounded-md bg-popover shadow-md max-h-60 overflow-y-auto">
          {/* Actions */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Select All
            </button>
            <span className="text-muted-foreground text-xs">|</span>
            <button
              onClick={clearAll}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Options */}
          {meta.values.map((v) => (
            <label
              key={v}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={value.has(v)}
                onChange={() => toggleValue(v)}
                className="rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm text-foreground truncate">{v}</span>
            </label>
          ))}

          {meta.values.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No values available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
