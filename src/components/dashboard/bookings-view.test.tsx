import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingsView } from "./bookings-view";

const mocks = vi.hoisted(() => ({
  role: "mentee" as "mentee" | "mentor",
  refresh: vi.fn(),
  listBookings: vi.fn(),
  getPaymentsConfig: vi.fn(),
  startCheckout: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { role: mocks.role },
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/api/bookings", () => ({
  acceptBooking: vi.fn(),
  cancelBooking: vi.fn(),
  completeBooking: vi.fn(),
  declineBooking: vi.fn(),
  noShowBooking: vi.fn(),
  listBookings: mocks.listBookings,
}));

vi.mock("@/lib/api/payments", () => ({
  getPaymentsConfig: mocks.getPaymentsConfig,
  startCheckout: mocks.startCheckout,
}));

const emptyPage = { items: [], nextCursor: null };

describe("BookingsView", () => {
  beforeEach(() => {
    mocks.role = "mentee";
    mocks.listBookings.mockResolvedValue(emptyPage);
    mocks.getPaymentsConfig.mockResolvedValue({
      enabled: false,
      provider: "disabled",
    });
  });

  it("shows the mentee empty state with a link to explore mentors", async () => {
    render(<BookingsView />);

    expect(
      await screen.findByText("Aún no tienes reservas."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explorar mentoras" }),
    ).toHaveAttribute("href", "/mentors");
  });

  it("shows the mentor empty state with a link to availability", async () => {
    mocks.role = "mentor";
    render(<BookingsView />);

    expect(
      await screen.findByText(/Aún no tienes solicitudes\./),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir a disponibilidad" }),
    ).toHaveAttribute("href", "/dashboard/availability");
  });

  it("hides the 'Por pagar' filter when payments are disabled", async () => {
    render(<BookingsView />);

    expect(await screen.findByRole("button", { name: "Todas" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Por pagar" }),
    ).not.toBeInTheDocument();
  });

  it("shows the 'Por pagar' filter when payments are enabled", async () => {
    mocks.getPaymentsConfig.mockResolvedValue({
      enabled: true,
      provider: "fake",
    });
    render(<BookingsView />);

    expect(
      await screen.findByRole("button", { name: "Por pagar" }),
    ).toBeVisible();
  });
});
