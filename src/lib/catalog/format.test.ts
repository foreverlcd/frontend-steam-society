import { describe, expect, it } from "vitest";
import {
  formatAreas,
  formatDayHeading,
  formatLanguages,
  formatPrice,
  matchLabel,
  mentorDisplayName,
  priceLabel,
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

  it("formats day headings with only the first letter capitalized", () => {
    expect(formatDayHeading("2026-11-18")).toBe("Miércoles 18 de noviembre");
  });

  it("returns the input when the day is invalid", () => {
    expect(formatDayHeading("no-es-fecha")).toBe("no-es-fecha");
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

describe("matchLabel", () => {
  it("describes high scores as a very good match", () => {
    expect(matchLabel(100)).toBe("Muy buena coincidencia");
    expect(matchLabel(80)).toBe("Muy buena coincidencia");
  });

  it("describes mid scores as a good match", () => {
    expect(matchLabel(79.9)).toBe("Buena coincidencia");
    expect(matchLabel(60)).toBe("Buena coincidencia");
  });

  it("falls back to a neutral label below 60", () => {
    expect(matchLabel(59.9)).toBe("Coincidencia");
    expect(matchLabel(0)).toBe("Coincidencia");
  });
});

describe("priceLabel", () => {
  const base = { id: "o1", title: "Sesión", durationMinutes: 60 };

  it("marks an offering flagged as free as a free session", () => {
    expect(
      priceLabel([{ ...base, isFree: true, priceMinor: 0, currency: "PEN" }]),
    ).toBe("Sesión gratuita");
  });

  it("treats a zero price as a free session even if isFree is false", () => {
    expect(
      priceLabel([{ ...base, isFree: false, priceMinor: 0, currency: "PEN" }]),
    ).toBe("Sesión gratuita");
  });

  it("shows the lowest paid price using the formatPrice format", () => {
    const label = priceLabel([
      { ...base, id: "o2", isFree: false, priceMinor: 8000, currency: "PEN" },
      { ...base, id: "o3", isFree: false, priceMinor: 5000, currency: "PEN" },
    ]);

    expect(label).toBe(
      `Desde ${formatPrice({ isFree: false, priceMinor: 5000, currency: "PEN" })}`,
    );
    expect(label).toMatch(/^Desde S\//);
  });
});
