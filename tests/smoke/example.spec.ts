import { test, expect } from "@playwright/test";

test.describe("smoke example", () => {
  test("should execute a minimal passing test", async () => {
    expect(true).toBe(true);
  });

  test("should support grep-friendly naming @smoke", async () => {
    expect([1, 2, 3]).toContain(2);
  });
});