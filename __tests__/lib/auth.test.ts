// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSessionCookie, verifySessionCookie, parseAuthUsers } from "@/lib/auth";

const TEST_SECRET = "test-secret-key-for-hmac-signing-1234567890abcdef";

describe("lib/auth", () => {
  describe("createSessionCookie + verifySessionCookie", () => {
    it("round-trips: create then verify returns the username", async () => {
      const cookie = await createSessionCookie("admin", TEST_SECRET);
      const username = await verifySessionCookie(cookie, TEST_SECRET);
      expect(username).toBe("admin");
    });

    it("returns null for expired cookie", async () => {
      // Mock Date.now to create an already-expired cookie
      const realNow = Date.now;
      const pastTime = realNow() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      vi.spyOn(Date, "now").mockReturnValueOnce(pastTime);

      const cookie = await createSessionCookie("admin", TEST_SECRET);

      // Restore Date.now for verification
      vi.restoreAllMocks();
      const username = await verifySessionCookie(cookie, TEST_SECRET);
      expect(username).toBeNull();
    });

    it("returns null for tampered payload", async () => {
      const cookie = await createSessionCookie("admin", TEST_SECRET);
      const [, sig] = cookie.split(".");
      // Replace payload with different base64url content
      const tamperedPayload = btoa(JSON.stringify({ u: "hacker", e: Date.now() + 999999999 }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const tampered = `${tamperedPayload}.${sig}`;
      const username = await verifySessionCookie(tampered, TEST_SECRET);
      expect(username).toBeNull();
    });

    it("returns null for tampered signature", async () => {
      const cookie = await createSessionCookie("admin", TEST_SECRET);
      const [payload] = cookie.split(".");
      const tampered = `${payload}.invalidsignaturedata`;
      const username = await verifySessionCookie(tampered, TEST_SECRET);
      expect(username).toBeNull();
    });

    it("returns null for cookie without dot separator", async () => {
      const username = await verifySessionCookie("nodothere", TEST_SECRET);
      expect(username).toBeNull();
    });

    it("returns null for wrong secret", async () => {
      const cookie = await createSessionCookie("admin", TEST_SECRET);
      const username = await verifySessionCookie(cookie, "wrong-secret");
      expect(username).toBeNull();
    });

    it("returns null for empty cookie", async () => {
      const username = await verifySessionCookie(".", TEST_SECRET);
      expect(username).toBeNull();
    });
  });

  describe("parseAuthUsers", () => {
    it("parses single user", () => {
      expect(parseAuthUsers("admin:secret")).toEqual([
        { username: "admin", password: "secret" },
      ]);
    });

    it("parses multiple users", () => {
      expect(parseAuthUsers("admin:pass1,user2:pass2")).toEqual([
        { username: "admin", password: "pass1" },
        { username: "user2", password: "pass2" },
      ]);
    });

    it("handles password containing colons", () => {
      expect(parseAuthUsers("admin:pass:with:colons")).toEqual([
        { username: "admin", password: "pass:with:colons" },
      ]);
    });

    it("returns empty array for empty string", () => {
      expect(parseAuthUsers("")).toEqual([]);
    });

    it("returns empty array for whitespace", () => {
      expect(parseAuthUsers("   ")).toEqual([]);
    });

    it("skips entries without colon", () => {
      expect(parseAuthUsers("admin:pass,invalid,user2:pass2")).toEqual([
        { username: "admin", password: "pass" },
        { username: "user2", password: "pass2" },
      ]);
    });
  });
});
