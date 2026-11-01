import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MentorDetailView } from "./mentor-detail-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getMentor: vi.fn(),
  getProfile: vi.fn(),
  getMentorSlots: vi.fn(),
  createBooking: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "mentee-1",
      email: "mentee@example.com",
      role: "mentee",
      status: "active",
      firstName: "Camila",
      lastName: "Torres",
      birthDate: null,
    },
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/api/catalog", () => ({
  getMentor: mocks.getMentor,
}));

vi.mock("@/lib/api/profiles", () => ({
  getProfile: mocks.getProfile,
}));

vi.mock("@/lib/api/scheduling", () => ({
  getMentorSlots: mocks.getMentorSlots,
}));

vi.mock("@/lib/api/bookings", () => ({
  createBooking: mocks.createBooking,
}));

const mentor = {
  userId: "mentor-1",
  firstName: "Daniela",
  lastName: "Ríos",
  headline: "Ingeniera de software",
  bio: "Acompaño a mujeres que empiezan en tecnología.",
  yearsExperience: 8,
  country: "PE",
  city: "Lima",
  areas: [{ id: "area-1", name: "Tecnología", parentId: null }],
  languages: [{ code: "es", name: "Español" }],
  offerings: [
    {
      id: "offering-1",
      title: "Conversación inicial 1:1",
      description: "Una sesión para conocernos.",
      type: "one_to_one" as const,
      durationMinutes: 60,
      capacity: 1,
      isFree: true,
      priceMinor: 0,
      currency: "PEN",
    },
  ],
};

const slots = [
  {
    startsAt: "2026-11-03T14:00:00.000Z",
    endsAt: "2026-11-03T15:00:00.000Z",
    timezone: "America/Lima",
    localStart: "2026-11-03T09:00:00",
    localEnd: "2026-11-03T10:00:00",
  },
];

beforeEach(() => {
  mocks.refresh.mockReset();
  mocks.getMentor.mockReset().mockResolvedValue(mentor);
  mocks.getProfile.mockReset().mockResolvedValue({
    role: "mentee",
    profile: {
      userId: "mentee-1",
      goals: "Ordenar mi ruta",
      educationLevel: "undergraduate",
      careerStage: "university",
      country: "PE",
      city: "Lima",
      areas: [],
      languages: [],
    },
  });
  mocks.getMentorSlots.mockReset().mockResolvedValue({
    mentorId: "mentor-1",
    offeringId: "offering-1",
    durationMinutes: 60,
    slots,
  });
  mocks.createBooking.mockReset().mockResolvedValue({
    id: "booking-1",
    status: "requested",
  });
});

describe("MentorDetailView", () => {
  it("shows the mentor profile and books a selected slot", async () => {
    render(<MentorDetailView mentorId="mentor-1" />);

    expect(
      await screen.findByRole("heading", { name: "Daniela Ríos" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Conversación inicial 1:1" }),
    ).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "09:00" }));
    fireEvent.change(
      await screen.findByLabelText("Mensaje para la mentora (opcional)"),
      { target: { value: "Quiero preparar una entrevista." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Solicitar reserva" }));

    await waitFor(() => {
      expect(mocks.createBooking).toHaveBeenCalledWith({
        offeringId: "offering-1",
        startsAt: slots[0].startsAt,
        message: "Quiero preparar una entrevista.",
      });
    });
    expect(
      await screen.findByText(/Reserva creada\. Estado: requested\./),
    ).toBeInTheDocument();
  });

  it("asks for a mentee profile before booking", async () => {
    mocks.getProfile.mockResolvedValue({ role: "mentee", profile: null });

    render(<MentorDetailView mentorId="mentor-1" />);

    expect(
      await screen.findByText(
        /Antes de reservar necesitas completar tu perfil/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Completar mi perfil" }),
    ).toHaveAttribute("href", "/dashboard/profile");
  });
});
