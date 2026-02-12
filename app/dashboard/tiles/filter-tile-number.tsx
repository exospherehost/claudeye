/** Number filter tile — dual-handle range slider with min/max text inputs. */
"use client";

import { useCallback } from "react";
import type { NumberFilterMeta } from "@/lib/evals/dashboard-types";

export interface NumberFilterState {
  min: number;
  max: number;
}

interface FilterTileNumberProps {
  meta: NumberFilterMeta;
  value: NumberFilterState;
  onChange: (value: NumberFilterState) => void;
}

export default function FilterTileNumber({ meta, value, onChange }: FilterTileNumberProps) {
  const range = meta.max - meta.min;
  const step = range <= 10 ? 1 : range <= 100 ? 5 : 10;

  const handleMinInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      if (!isNaN(num)) {
        onChange({ ...value, min: Math.min(num, value.max) });
      }
    },
    [value, onChange],
  );

  const handleMaxInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      if (!isNaN(num)) {
        onChange({ ...value, max: Math.max(num, value.min) });
      }
    },
    [value, onChange],
  );

  const handleMinRange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      onChange({ ...value, min: Math.min(num, value.max) });
    },
    [value, onChange],
  );

  const handleMaxRange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      onChange({ ...value, max: Math.max(num, value.min) });
    },
    [value, onChange],
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <label className="block text-sm font-medium text-foreground mb-2">
        {meta.label}
      </label>

      {/* Range sliders */}
      <div className="relative mb-3">
        <input
          type="range"
          min={meta.min}
          max={meta.max}
          step={step}
          value={value.min}
          onChange={handleMinRange}
          className="absolute w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          aria-label={`${meta.label} minimum`}
        />
        <input
          type="range"
          min={meta.min}
          max={meta.max}
          step={step}
          value={value.max}
          onChange={handleMaxRange}
          className="absolute w-full pointer-events-none appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          aria-label={`${meta.label} maximum`}
        />
        {/* Track background */}
        <div className="h-1 bg-muted rounded w-full mt-2" />
      </div>

      {/* Min/Max text inputs */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={meta.min}
          max={meta.max}
          step={step}
          value={value.min}
          onChange={handleMinInput}
          className="w-20 px-2 py-1 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`${meta.label} minimum value`}
        />
        <span className="text-muted-foreground text-sm">to</span>
        <input
          type="number"
          min={meta.min}
          max={meta.max}
          step={step}
          value={value.max}
          onChange={handleMaxInput}
          className="w-20 px-2 py-1 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`${meta.label} maximum value`}
        />
      </div>
    </div>
  );
}
