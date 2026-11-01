import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminMentorDetail } from "@/lib/api/admin-mentors";
import { AdminView } from "./admin-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  listAdminMentors: vi.fn(),
  getAdminMentor: vi.fn(),
  approveMentor: vi.fn(),
  rejectMentor: vi.fn(),
  suspendMentor: vi.fn(),
  reactivateMentor: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "admin-1",
      email: "admin@example.com",
      role: "admin",
      status: "active",
      firstName: null,
      lastName: null,
      birthDate: null,
    },
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/api/admin-mentors", () => ({
  listAdminMentors: mocks.listAdminMentors,
  getAdminMentor: mocks.getAdminMentor,
  approveMentor: mocks.approveMentor,
  rejectMentor: mocks.rejectMentor,
  suspendMentor: mocks.suspendMentor,
  reactivateMentor: mocks.reactivateMentor,
}));

const detail: AdminMentorDetail = {
  mentor: {
    userId: "mentor-1",
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    userStatus: "active",
    headline: "Ingeniera de datos",
    bio: "Acompaño a mujeres que empiezan en tecnología.",
    yearsExperience: 6,
    country: "PE",
    city: "Lima",
    status: "pending_review",
    reviewedAt: null,
    rejectionReason: null,
    minNoticeHours: 24,
    maxAdvanceDays: 60,
    areas: [{ id: "tech", name: "Tecnología", parentId: null }],
    languages: [{ code: "es", name: "Español" }],
  },
  onboarding: {
    version: 1,
    role: "mentor",
    steps: [
      {
        code: "about",
        title: "Sobre ti",
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
    answers: { city: "Lima" },
    completion: { complete: true, missing: [] },
    options: { areas: [], languages: [] },
  },
};

beforeEach(() => {
  mocks.refresh.mockReset();
  mocks.listAdminMentors.mockReset().mockResolvedValue({
    items: [detail.mentor],
    nextCursor: null,
  });
  mocks.getAdminMentor.mockReset().mockResolvedValue(detail);
  mocks.approveMentor.mockReset().mockResolvedValue({ profile: {} });
  mocks.rejectMentor.mockReset().mockResolvedValue({ profile: {} });
  mocks.suspendMentor.mockReset().mockResolvedValue({ profile: {} });
  mocks.reactivateMentor.mockReset().mockResolvedValue({ profile: {} });
});

describe("AdminView", () => {
  it("loads the pending inbox and shows the full onboarding detail", async () => {
    render(<AdminView />);

    expect(
      await screen.findByRole("heading", { name: "Panel de mentoras" }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("Ada Lovelace")).not.toHaveLength(0);
    expect(await screen.findByText("Ingeniera de datos")).toBeInTheDocument();
    expect(await screen.findByText("Lima")).toBeInTheDocument();
    expect(mocks.listAdminMentors).toHaveBeenCalledWith(
      { status: "pending_review" },
      expect.any(AbortSignal),
    );
    expect(mocks.getAdminMentor).toHaveBeenCalledWith(
      "mentor-1",
      expect.any(AbortSignal),
    );
  });

  it("approves the selected mentor", async () => {
    render(<AdminView />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Aprobar perfil" }),
    );

    await waitFor(() => {
      expect(mocks.approveMentor).toHaveBeenCalledWith("mentor-1");
    });
    expect(await screen.findByText("Perfil aprobado.")).toBeInTheDocument();
  });

  it("rejects the selected mentor with a reason", async () => {
    render(<AdminView />);

    fireEvent.click(await screen.findByRole("button", { name: "Rechazar" }));
    fireEvent.change(screen.getByLabelText("Motivo del rechazo"), {
      target: { value: "Falta detalle en la experiencia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar rechazo" }));

    await waitFor(() => {
      expect(mocks.rejectMentor).toHaveBeenCalledWith(
        "mentor-1",
        "Falta detalle en la experiencia",
      );
    });
  });
});
