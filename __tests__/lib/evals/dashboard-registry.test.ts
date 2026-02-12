// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerFilter,
  getRegisteredFilters,
  getFiltersForView,
  hasFilters,
  clearFilters,
  registerView,
  getRegisteredViews,
  hasViews,
  clearViews,
} from "@/lib/evals/dashboard-registry";

describe("evals/dashboard-registry", () => {
  beforeEach(() => {
    clearFilters();
    clearViews();
  });

  it("starts empty", () => {
    expect(getRegisteredFilters()).toEqual([]);
    expect(hasFilters()).toBe(false);
  });

  it("registerFilter adds a filter", () => {
    const fn = () => true;
    registerFilter("has-errors", fn, "Has Errors");
    expect(hasFilters()).toBe(true);
    const filters = getRegisteredFilters();
    expect(filters).toHaveLength(1);
    expect(filters[0].name).toBe("has-errors");
    expect(filters[0].fn).toBe(fn);
    expect(filters[0].label).toBe("Has Errors");
  });

  it("registerFilter defaults label to name when not provided", () => {
    registerFilter("my-filter", () => 42);
    const filters = getRegisteredFilters();
    expect(filters[0].label).toBe("my-filter");
  });

  it("registerFilter replaces a filter with the same name in the same view", () => {
    const fn1 = () => true;
    const fn2 = () => false;
    registerFilter("dup", fn1, "Dup");
    registerFilter("dup", fn2, "Dup v2");
    const filters = getRegisteredFilters();
    expect(filters).toHaveLength(1);
    expect(filters[0].fn).toBe(fn2);
    expect(filters[0].label).toBe("Dup v2");
  });

  it("registerFilter keeps distinct names separate", () => {
    registerFilter("a", () => true);
    registerFilter("b", () => "hello");
    expect(getRegisteredFilters()).toHaveLength(2);
  });

  it("clearFilters empties the registry", () => {
    registerFilter("x", () => 1);
    expect(hasFilters()).toBe(true);
    clearFilters();
    expect(hasFilters()).toBe(false);
    expect(getRegisteredFilters()).toHaveLength(0);
  });

  it("getRegisteredFilters returns items in registration order", () => {
    registerFilter("first", () => true);
    registerFilter("second", () => 42);
    registerFilter("third", () => "hello");
    const names = getRegisteredFilters().map((f) => f.name);
    expect(names).toEqual(["first", "second", "third"]);
  });

  it("registerFilter stores condition when provided", () => {
    const fn = () => true;
    const condition = () => true;
    registerFilter("with-cond", fn, "Label", condition);
    const filters = getRegisteredFilters();
    expect(filters[0].condition).toBe(condition);
  });

  it("registerFilter omits condition when not provided", () => {
    registerFilter("no-cond", () => true);
    const filters = getRegisteredFilters();
    expect(filters[0].condition).toBeUndefined();
  });

  // --- View-scoped filter tests ---

  it("registerFilter defaults view to 'default' when not provided", () => {
    registerFilter("my-filter", () => true);
    const filters = getRegisteredFilters();
    expect(filters[0].view).toBe("default");
  });

  it("registerFilter stores view when provided", () => {
    registerFilter("my-filter", () => true, "Label", undefined, "performance");
    const filters = getRegisteredFilters();
    expect(filters[0].view).toBe("performance");
  });

  it("same filter name in different views kept separate", () => {
    registerFilter("turn-count", () => 5, "Turn Count", undefined, "performance");
    registerFilter("turn-count", () => 10, "Turn Count", undefined, "quality");
    const filters = getRegisteredFilters();
    expect(filters).toHaveLength(2);
    expect(filters[0].view).toBe("performance");
    expect(filters[1].view).toBe("quality");
  });

  it("dedup within same view (same view + same name replaces)", () => {
    const fn1 = () => 1;
    const fn2 = () => 2;
    registerFilter("turn-count", fn1, "V1", undefined, "perf");
    registerFilter("turn-count", fn2, "V2", undefined, "perf");
    const filters = getRegisteredFilters();
    expect(filters).toHaveLength(1);
    expect(filters[0].fn).toBe(fn2);
    expect(filters[0].label).toBe("V2");
  });

  it("getFiltersForView returns correct subset", () => {
    registerFilter("a", () => true, "A", undefined, "performance");
    registerFilter("b", () => 42, "B", undefined, "quality");
    registerFilter("c", () => "x", "C", undefined, "performance");
    registerFilter("d", () => false, "D"); // default view

    expect(getFiltersForView("performance").map((f) => f.name)).toEqual(["a", "c"]);
    expect(getFiltersForView("quality").map((f) => f.name)).toEqual(["b"]);
    expect(getFiltersForView("default").map((f) => f.name)).toEqual(["d"]);
    expect(getFiltersForView("nonexistent")).toEqual([]);
  });

  it("hasFilters returns true for any filters regardless of view", () => {
    registerFilter("a", () => true, "A", undefined, "performance");
    expect(hasFilters()).toBe(true);
  });

  // --- View registry tests ---

  it("view registry starts empty", () => {
    expect(getRegisteredViews()).toEqual([]);
    expect(hasViews()).toBe(false);
  });

  it("registerView adds a view", () => {
    registerView("performance", "Performance Metrics");
    expect(hasViews()).toBe(true);
    const views = getRegisteredViews();
    expect(views).toHaveLength(1);
    expect(views[0]).toEqual({ name: "performance", label: "Performance Metrics" });
  });

  it("registerView replaces a view with the same name", () => {
    registerView("perf", "Performance");
    registerView("perf", "Performance v2");
    const views = getRegisteredViews();
    expect(views).toHaveLength(1);
    expect(views[0].label).toBe("Performance v2");
  });

  it("registerView keeps distinct names separate", () => {
    registerView("perf", "Performance");
    registerView("quality", "Quality");
    expect(getRegisteredViews()).toHaveLength(2);
  });

  it("clearViews empties the view registry", () => {
    registerView("perf", "Performance");
    expect(hasViews()).toBe(true);
    clearViews();
    expect(hasViews()).toBe(false);
    expect(getRegisteredViews()).toHaveLength(0);
  });

  it("clearViews does not affect filter registry", () => {
    registerFilter("a", () => true);
    registerView("perf", "Performance");
    clearViews();
    expect(hasFilters()).toBe(true);
    expect(hasViews()).toBe(false);
  });

  it("clearFilters does not affect view registry", () => {
    registerFilter("a", () => true);
    registerView("perf", "Performance");
    clearFilters();
    expect(hasFilters()).toBe(false);
    expect(hasViews()).toBe(true);
  });
});
