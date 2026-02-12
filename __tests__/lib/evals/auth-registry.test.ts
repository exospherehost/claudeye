// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { registerAuthUsers, getAuthUsers, clearAuthUsers } from "@/lib/evals/auth-registry";

describe("evals/auth-registry", () => {
  beforeEach(() => {
    clearAuthUsers();
  });

  it("starts empty", () => {
    expect(getAuthUsers()).toEqual([]);
  });

  it("registers users and retrieves them", () => {
    registerAuthUsers([{ username: "admin", password: "secret" }]);
    expect(getAuthUsers()).toEqual([{ username: "admin", password: "secret" }]);
  });

  it("appends users across multiple calls", () => {
    registerAuthUsers([{ username: "admin", password: "pass1" }]);
    registerAuthUsers([{ username: "user2", password: "pass2" }]);
    expect(getAuthUsers()).toEqual([
      { username: "admin", password: "pass1" },
      { username: "user2", password: "pass2" },
    ]);
  });

  it("clearAuthUsers resets the list", () => {
    registerAuthUsers([{ username: "admin", password: "secret" }]);
    clearAuthUsers();
    expect(getAuthUsers()).toEqual([]);
  });

  it("registers multiple users in one call", () => {
    registerAuthUsers([
      { username: "a", password: "1" },
      { username: "b", password: "2" },
    ]);
    expect(getAuthUsers()).toHaveLength(2);
  });
});
