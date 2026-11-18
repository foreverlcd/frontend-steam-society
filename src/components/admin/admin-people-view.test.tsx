import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUserDetail, AdminUserSummary } from "@/lib/api/admin";
import { AdminPeopleView } from "./admin-people-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  listAdminUsers: vi.fn(),
  getAdminUser: vi.fn(),
  suspendUser: vi.fn(),
  reactivateUser: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@example.com", role: "admin" },
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/api/admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/admin")>()),
  listAdminUsers: mocks.listAdminUsers,
  getAdminUser: mocks.getAdminUser,
}));

vi.mock("@/lib/api/admin-reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/admin-reports")>()),
  suspendUser: mocks.suspendUser,
  reactivateUser: mocks.reactivateUser,
}));

const summary: AdminUserSummary = {
  id: "mentor-1",
  email: "laura@example.com",
  name: "Laura Díaz",
  role: "mentor",
  status: "active",
  emailVerified: true,
  mentorStatus: "approved",
  createdAt: "2026-10-01T15:00:00.000Z",
};

const detail: AdminUserDetail = {
  ...summary,
  timezone: "America/Lima",
  mfaEnabled: false,
  bookingsAsMentee: {},
  bookingsAsMentor: { confirmed: 2, completed: 4 },
  reportsAgainst: { open: 2, dismissed: 1 },
  reportsFiled: 0,
  blockedByCount: 1,
  history: [
    {
      action: "user.reactivated",
      at: "2026-11-01T15:00:00.000Z",
      actorName: "Equipo Steam",
      metadata: {},
    },
  ],
};

beforeEach(() => {
  mocks.refresh.mockReset();
  mocks.listAdminUsers
    .mockReset()
    .mockResolvedValue({ items: [summary], nextCursor: null });
  mocks.getAdminUser.mockReset().mockResolvedValue(detail);
  mocks.suspendUser.mockReset().mockResolvedValue({
    userId: "mentor-1",
    status: "suspended",
    cancelledBookings: 2,
  });
  mocks.reactivateUser
    .mockReset()
    .mockResolvedValue({ userId: "mentor-1", status: "active" });
});

async function openPerson() {
  render(<AdminPeopleView />);
  fireEvent.click(await screen.findByRole("button", { name: /Laura Díaz/ }));
  await screen.findByRole("heading", { name: "Laura Díaz" });
}

describe("AdminPeopleView", () => {
  it("searches and filters the list", async () => {
    render(<AdminPeopleView />);
    await screen.findByRole("button", { name: /Laura Díaz/ });

    fireEvent.change(screen.getByLabelText("Buscar"), {
      target: { value: " laura " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(mocks.listAdminUsers).toHaveBeenLastCalledWith(
        { q: "laura" },
        expect.any(AbortSignal),
      );
    });

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "suspended" },
    });

    await waitFor(() => {
      expect(mocks.listAdminUsers).toHaveBeenLastCalledWith(
        { q: "laura", status: "suspended" },
        expect.any(AbortSignal),
      );
    });
  });

  it("shows counts and history in the detail panel", async () => {
    await openPerson();

    expect(screen.getByText("Como mentora:")).toBeInTheDocument();
    expect(screen.getByText("Cuenta reactivada")).toBeInTheDocument();
    expect(screen.getByText(/por Equipo Steam/)).toBeInTheDocument();
  });

  it("suspends with a required reason and a confirm step", async () => {
    await openPerson();

    fireEvent.click(screen.getByRole("button", { name: "Suspender cuenta" }));
    fireEvent.change(screen.getByLabelText("Motivo de la suspensión"), {
      target: { value: "ok" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByText("Escribe al menos 3 caracteres."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Motivo de la suspensión"), {
      target: { value: "Acoso reiterado a mentoradas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByText("¿Suspender la cuenta de Laura Díaz?"),
    ).toBeInTheDocument();
    expect(mocks.suspendUser).not.toHaveBeenCalled();

    mocks.getAdminUser.mockResolvedValue({ ...detail, status: "suspended" });
    fireEvent.click(
      screen.getByRole("button", { name: "Sí, suspender cuenta" }),
    );

    await waitFor(() => {
      expect(mocks.suspendUser).toHaveBeenCalledWith(
        "mentor-1",
        "Acoso reiterado a mentoradas",
      );
    });
    expect(
      await screen.findByText(/Se cancelaron 2 reservas abiertas/),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Reactivar cuenta" }),
    ).toBeInTheDocument();
  });

  it("shows the API error when the account is no longer active", async () => {
    const { ApiError } = await import("@/lib/api/client");
    mocks.suspendUser.mockRejectedValue(
      new ApiError(409, "USER_NOT_ACTIVE", "not active"),
    );
    await openPerson();

    fireEvent.click(screen.getByRole("button", { name: "Suspender cuenta" }));
    fireEvent.change(screen.getByLabelText("Motivo de la suspensión"), {
      target: { value: "Spam repetido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sí, suspender cuenta" }),
    );

    expect(
      await screen.findByText(/Solo se pueden suspender cuentas activas/),
    ).toBeInTheDocument();
  });

  it("reactivates a suspended account after confirming", async () => {
    mocks.getAdminUser.mockResolvedValue({ ...detail, status: "suspended" });
    await openPerson();

    fireEvent.click(screen.getByRole("button", { name: "Reactivar cuenta" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Sí, reactivar cuenta" }),
    );

    await waitFor(() => {
      expect(mocks.reactivateUser).toHaveBeenCalledWith("mentor-1");
    });
  });
});
