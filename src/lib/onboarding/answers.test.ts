import { describe, expect, it } from "vitest";
import type { OnboardingOptions, OnboardingStep } from "@/lib/api/onboarding";
import {
  buildAnswersPayload,
  findFirstStepWithMissing,
  getAreaChildren,
  getAreaRoots,
  getMissingQuestionLabels,
  isStepComplete,
  validateStep,
} from "./answers";

const options: OnboardingOptions = {
  areas: [
    { id: "tech", name: "Tecnología", parentId: null },
    { id: "science", name: "Ciencia", parentId: null },
    { id: "ai", name: "Inteligencia artificial", parentId: "tech" },
    { id: "data", name: "Data", parentId: "tech" },
    { id: "bio", name: "Biología", parentId: "science" },
  ],
  languages: [
    { code: "es", name: "Español" },
    { code: "en", name: "Inglés" },
  ],
};

const supportOptions = [
  { value: "study_plan", label: "Plan de estudio" },
  { value: "portfolio", label: "Portafolio" },
  { value: "interviews", label: "Entrevistas" },
];

const steps: OnboardingStep[] = [
  {
    code: "basic",
    title: "Básico",
    questions: [
      { code: "city", label: "Ciudad", type: "text", required: true },
      {
        code: "linkedinUrl",
        label: "LinkedIn",
        type: "url",
        required: false,
      },
    ],
  },
  {
    code: "stem",
    title: "STEM",
    questions: [
      {
        code: "primaryAreaId",
        label: "Área principal",
        type: "area_single",
        required: true,
      },
      {
        code: "areaIds",
        label: "Subáreas",
        type: "area_multi",
        required: true,
        maxSelections: 2,
      },
      {
        code: "supportTypes",
        label: "Apoyos",
        type: "multi_select",
        required: true,
        maxSelections: 2,
        options: supportOptions,
      },
      {
        code: "industries",
        label: "Industrias",
        type: "multi_select",
        required: false,
        maxSelections: 2,
        options: [{ value: "tech", label: "Tech" }],
      },
    ],
  },
  {
    code: "preferences",
    title: "Preferencias",
    questions: [
      {
        code: "languageCodes",
        label: "Idioma",
        type: "language_single",
        required: true,
      },
      {
        code: "availabilityPreferences",
        label: "Disponibilidad",
        type: "multi_select",
        required: true,
        maxSelections: 2,
        options: [
          { value: "mornings", label: "Mañanas" },
          { value: "afternoons", label: "Tardes" },
        ],
      },
    ],
  },
];

describe("validateStep", () => {
  it("requires a city and validates optional URLs", () => {
    expect(
      validateStep(steps[0], { city: "", linkedinUrl: "not-a-url" }, options),
    ).toEqual({
      city: "Completa este campo.",
      linkedinUrl: "Ingresa una URL válida (por ejemplo, https://...).",
    });

    expect(
      validateStep(
        steps[0],
        { city: "Lima", linkedinUrl: "https://linkedin.com/in/ada" },
        options,
      ),
    ).toEqual({});
  });

  it("validates the primary area and its children", () => {
    expect(
      validateStep(steps[1], { primaryAreaId: "tech", areaIds: [] }, options),
    ).toMatchObject({ areaIds: "Elige al menos una subárea." });

    expect(
      validateStep(
        steps[1],
        { primaryAreaId: "tech", areaIds: ["bio"] },
        options,
      ),
    ).toMatchObject({
      areaIds: "Elige subáreas del área principal.",
    });

    expect(
      validateStep(
        steps[1],
        {
          primaryAreaId: "tech",
          areaIds: ["ai"],
          supportTypes: ["study_plan", "portfolio", "interviews"],
        },
        options,
      ),
    ).toMatchObject({
      supportTypes: "Elige hasta 2 opciones.",
    });

    expect(
      validateStep(
        steps[1],
        {
          primaryAreaId: "tech",
          areaIds: ["ai"],
          supportTypes: ["study_plan"],
        },
        options,
      ),
    ).toEqual({});
  });

  it("requires exactly one valid language", () => {
    expect(
      validateStep(
        steps[2],
        { languageCodes: [], availabilityPreferences: ["mornings"] },
        options,
      ),
    ).toMatchObject({ languageCodes: "Elige un idioma." });

    expect(
      validateStep(
        steps[2],
        {
          languageCodes: ["es", "en"],
          availabilityPreferences: ["mornings"],
        },
        options,
      ),
    ).toMatchObject({ languageCodes: "Elige solo un idioma." });

    expect(
      validateStep(
        steps[2],
        {
          languageCodes: ["es"],
          availabilityPreferences: ["mornings"],
        },
        options,
      ),
    ).toEqual({});
  });
});

describe("buildAnswersPayload", () => {
  it("sends only complete and valid answers", () => {
    expect(
      buildAnswersPayload(
        steps,
        {
          city: "  Lima  ",
          linkedinUrl: "",
          primaryAreaId: "tech",
          areaIds: ["ai"],
          supportTypes: ["study_plan"],
          industries: [],
          languageCodes: ["es"],
          availabilityPreferences: ["mornings"],
        },
        options,
      ),
    ).toEqual({
      city: "Lima",
      primaryAreaId: "tech",
      areaIds: ["ai"],
      supportTypes: ["study_plan"],
      industries: [],
      languageCodes: ["es"],
      availabilityPreferences: ["mornings"],
    });
  });

  it("never sends a primary area without valid subareas", () => {
    expect(
      buildAnswersPayload(
        steps,
        { primaryAreaId: "tech", areaIds: [] },
        options,
      ),
    ).toEqual({});

    expect(
      buildAnswersPayload(
        steps,
        { primaryAreaId: "tech", areaIds: ["bio"] },
        options,
      ),
    ).toEqual({});
  });

  it("omits empty required multi-selects but keeps empty optional ones", () => {
    const payload = buildAnswersPayload(
      steps,
      {
        primaryAreaId: "tech",
        areaIds: ["ai"],
        supportTypes: [],
        industries: [],
      },
      options,
    );

    expect(payload).not.toHaveProperty("supportTypes");
    expect(payload.industries).toEqual([]);
  });

  it("omits invalid single-choice values and languages", () => {
    const payload = buildAnswersPayload(
      steps,
      {
        languageCodes: ["es", "en"],
        supportTypes: ["unknown"],
      },
      options,
    );

    expect(payload).not.toHaveProperty("languageCodes");
    expect(payload).not.toHaveProperty("supportTypes");
  });
});

describe("onboarding step helpers", () => {
  it("finds the first step with a missing answer", () => {
    expect(findFirstStepWithMissing(steps, ["supportTypes"])).toBe(1);
    expect(findFirstStepWithMissing(steps, ["languageCodes"])).toBe(2);
    expect(findFirstStepWithMissing(steps, [])).toBe(0);
  });

  it("maps missing codes to readable labels", () => {
    expect(
      getMissingQuestionLabels(steps, ["city", "areaIds", "unknown"]),
    ).toEqual(["Ciudad", "Subáreas", "unknown"]);
  });

  it("marks a step complete when it has no missing required answers", () => {
    expect(isStepComplete(steps[0], ["city"])).toBe(false);
    expect(isStepComplete(steps[0], [])).toBe(true);
  });

  it("separates root areas from their children", () => {
    expect(getAreaRoots(options.areas).map((area) => area.id)).toEqual([
      "tech",
      "science",
    ]);
    expect(
      getAreaChildren(options.areas, "tech").map((area) => area.id),
    ).toEqual(["ai", "data"]);
  });
});
