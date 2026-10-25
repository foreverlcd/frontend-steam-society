import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OnboardingData } from "@/lib/api/onboarding";
import { OnboardingView } from "./onboarding-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getOnboarding: vi.fn(),
  updateOnboarding: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/lib/api/onboarding", () => ({
  getOnboarding: mocks.getOnboarding,
  updateOnboarding: mocks.updateOnboarding,
}));

const initialData: OnboardingData = {
  version: 1,
  role: "mentee",
  steps: [
    {
      code: "about",
      title: "Cuéntanos sobre ti",
      questions: [
        {
          code: "city",
          label: "Ciudad",
          type: "text",
          required: true,
        },
      ],
    },
  ],
  answers: {},
  completion: { complete: false, missing: ["city"] },
  options: { areas: [], languages: [] },
};

const completedData: OnboardingData = {
  ...initialData,
  answers: { city: "Lima" },
  completion: { complete: true, missing: [] },
};

describe("OnboardingView", () => {
  it("validates the current step before saving", async () => {
    mocks.getOnboarding.mockResolvedValue(initialData);
    render(<OnboardingView />);

    const submit = await screen.findByRole("button", {
      name: "Finalizar onboarding",
    });

    fireEvent.click(submit);

    expect(await screen.findByText("Completa este campo.")).toBeInTheDocument();
    expect(mocks.updateOnboarding).not.toHaveBeenCalled();
  });

  it("saves the step and shows the completion state", async () => {
    mocks.getOnboarding.mockResolvedValue(initialData);
    mocks.updateOnboarding.mockResolvedValue(completedData);
    render(<OnboardingView />);

    fireEvent.change(await screen.findByLabelText("Ciudad"), {
      target: { value: "Lima" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Finalizar onboarding" }),
    );

    await waitFor(() => {
      expect(mocks.updateOnboarding).toHaveBeenCalledWith({
        version: 1,
        answers: { city: "Lima" },
      });
    });

    expect(
      await screen.findByRole("heading", {
        name: "Tus respuestas están guardadas",
      }),
    ).toBeInTheDocument();
  });
});
