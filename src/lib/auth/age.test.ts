import { describe, expect, it } from "vitest";
import { ageOn, needsGuardianConsent } from "./age";

describe("ageOn", () => {
  it("counts a birthday that already happened this year", () => {
    expect(ageOn("2012-03-01", "2026-11-18")).toBe(14);
  });

  it("does not count a birthday still to come", () => {
    expect(ageOn("2012-12-01", "2026-11-18")).toBe(13);
  });

  it("returns null for malformed dates", () => {
    expect(ageOn("", "2026-11-18")).toBeNull();
  });
});

describe("needsGuardianConsent", () => {
  it("asks under 14", () => {
    expect(needsGuardianConsent("2012-11-19", "2026-11-18")).toBe(true);
  });

  it("does not ask from the 14th birthday", () => {
    expect(needsGuardianConsent("2012-11-18", "2026-11-18")).toBe(false);
  });

  it("does not ask without a date", () => {
    expect(needsGuardianConsent("", "2026-11-18")).toBe(false);
  });
});
