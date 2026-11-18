import { describe, expect, it } from "vitest";
import {
  dateRangeToIso,
  historyActionLabel,
  historyReason,
  sumCounts,
} from "./labels";

describe("admin labels", () => {
  it("labels known history actions and falls back to the raw code", () => {
    expect(historyActionLabel("user.suspended")).toBe("Cuenta suspendida");
    expect(historyActionLabel("something.new")).toBe("something.new");
  });

  it("reads a reason from audit metadata only when it is text", () => {
    expect(historyReason({ reason: "Acoso" })).toBe("Acoso");
    expect(historyReason({ reason: 3 })).toBeNull();
    expect(historyReason(null)).toBeNull();
  });

  it("sums partial counts", () => {
    expect(sumCounts({ a: 2, b: 3 })).toBe(5);
    expect(sumCounts(undefined)).toBe(0);
  });

  it("builds an inclusive local date range", () => {
    const range = dateRangeToIso("2026-11-01", "2026-11-07");

    expect(range.from).toBe(new Date(2026, 10, 1).toISOString());
    expect(range.to).toBe(new Date(2026, 10, 8).toISOString());
    expect(dateRangeToIso("", "nope")).toEqual({});
  });
});
