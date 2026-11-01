import { describe, expect, it } from "vitest";
import {
  formatAreas,
  formatLanguages,
  formatPrice,
  mentorDisplayName,
} from "./format";

describe("catalog formatting", () => {
  it("builds the mentor display name from available parts", () => {
    expect(mentorDisplayName({ firstName: "Ada", lastName: "Lovelace" })).toBe(
      "Ada Lovelace",
    );
    expect(mentorDisplayName({ firstName: null, lastName: null })).toBe(
      "Mentora de Steam Society",
    );
  });

  it("formats free and paid offerings", () => {
    expect(formatPrice({ isFree: true, priceMinor: 0, currency: "PEN" })).toBe(
      "Gratis",
    );
    expect(
      formatPrice({ isFree: false, priceMinor: 5000, currency: "PEN" }),
    ).toMatch(/50/);
  });

  it("joins areas and languages with a middle dot", () => {
    expect(
      formatAreas({
        areas: [
          { id: "a1", name: "Tecnología", parentId: null },
          { id: "a2", name: "Ciencia", parentId: null },
        ],
      }),
    ).toBe("Tecnología · Ciencia");
    expect(
      formatLanguages({
        languages: [{ code: "es", name: "Español" }],
      }),
    ).toBe("Español");
  });
});
