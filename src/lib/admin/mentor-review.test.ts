import { describe, expect, it } from "vitest";
import type { OnboardingQuestion } from "@/lib/api/onboarding";
import { formatAnswer, formatDate, mentorDisplayName } from "./mentor-review";

const options = {
  areas: [
    { id: "tech", name: "Tecnología", parentId: null },
    { id: "ai", name: "Inteligencia artificial", parentId: "tech" },
  ],
  languages: [{ code: "es", name: "Español" }],
};

function question(
  type: OnboardingQuestion["type"],
  extra: Partial<OnboardingQuestion> = {},
): OnboardingQuestion {
  return {
    code: "answer",
    label: "Respuesta",
    type,
    required: true,
    ...extra,
  };
}

describe("mentor review formatting", () => {
  it("uses the full name or falls back to the email", () => {
    expect(
      mentorDisplayName({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      }),
    ).toBe("Ada Lovelace");
    expect(
      mentorDisplayName({
        firstName: null,
        lastName: null,
        email: "ada@example.com",
      }),
    ).toBe("ada@example.com");
  });

  it("formats select, area and language answers", () => {
    expect(
      formatAnswer(
        question("single_select", {
          options: [{ value: "professional", label: "Profesional" }],
        }),
        "professional",
        options,
      ),
    ).toBe("Profesional");
    expect(formatAnswer(question("area_multi"), ["ai"], options)).toBe(
      "Inteligencia artificial",
    );
    expect(formatAnswer(question("language_single"), ["es"], options)).toBe(
      "Español",
    );
  });

  it("marks empty answers and keeps unknown values", () => {
    expect(formatAnswer(question("text"), undefined, options)).toBe(
      "Sin responder",
    );
    expect(formatAnswer(question("text"), [], options)).toBe("Sin responder");
    expect(formatAnswer(question("area_single"), "unknown", options)).toBe(
      "unknown",
    );
  });

  it("formats dates and tolerates invalid values", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(formatDate("2026-10-30T12:00:00.000Z")).toContain("2026");
  });
});
