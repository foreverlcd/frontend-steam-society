import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/auth-context";
import {
  AccountSections,
  describeUserAgent,
  exportFileName,
} from "./account-sections";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));
const accountMocks = vi.hoisted(() => ({
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  changePassword: vi.fn(),
  requestEmailChange: vi.fn(),
  exportMyData: vi.fn(),
  deleteAccount: vi.fn(),
}));
const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("@/lib/api/auth", () => authMocks);
vi.mock("@/lib/api/account", () => accountMocks);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

// Test fixtures only.
const TEST_PASSWORD = "test-only-password";
const TEST_NEW_PASSWORD = "test-only-new-password";

const user = {
  id: "user-1",
  email: "ada@example.com",
  role: "mentee" as const,
  status: "active" as const,
  firstName: "Ada",
  lastName: null,
  birthDate: "1990-01-01",
  emailVerified: true,
  mfaEnabled: false,
};

const sessions = [
  {
    id: "a".repeat(32),
    current: true,
    signedInAt: "2026-11-17T10:00:00.000Z",
    lastActiveAt: "2026-11-17T11:00:00.000Z",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
  },
  {
    id: "b".repeat(32),
    current: false,
    signedInAt: null,
    lastActiveAt: "2026-11-16T09:00:00.000Z",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  },
];

function renderSections() {
  return render(
    <AuthProvider>
      <AccountSections />
    </AuthProvider>,
  );
}

describe("describeUserAgent", () => {
  it("names the browser and the system", () => {
    expect(describeUserAgent(sessions[0].userAgent)).toBe("Chrome en Linux");
    expect(describeUserAgent(sessions[1].userAgent)).toBe(
      "Safari en iPhone o iPad",
    );
    expect(describeUserAgent(null)).toBe("Navegador desconocido");
  });
});

describe("exportFileName", () => {
  it("uses the local date", () => {
    expect(exportFileName(new Date(2026, 0, 5, 23, 30))).toBe(
      "steam-society-mis-datos-2026-01-05.json",
    );
  });
});

describe("AccountSections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getMe.mockResolvedValue(user);
    accountMocks.listSessions.mockResolvedValue(sessions);
  });

  it("lists sessions and closes the others", async () => {
    accountMocks.revokeOtherSessions.mockResolvedValue({ revoked: 1 });
    renderSections();

    expect(await screen.findByText("Chrome en Linux")).toBeInTheDocument();
    expect(screen.getByText("Esta sesión")).toBeInTheDocument();
    // Only the other session can be closed one by one.
    expect(screen.getAllByRole("button", { name: "Cerrar" })).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar todas las demás" }),
    );
    expect(await screen.findByText("Cerramos 1 sesión.")).toBeInTheDocument();
    expect(accountMocks.listSessions).toHaveBeenCalledTimes(2);
  });

  it("checks the new password before calling the API", async () => {
    renderSections();
    fireEvent.click(
      await screen.findByRole("button", { name: "Cambiar contraseña" }),
    );
    fireEvent.change(screen.getByLabelText("Tu contraseña actual"), {
      target: { value: TEST_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText("Contraseña nueva"), {
      target: { value: TEST_NEW_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText("Repite la contraseña nueva"), {
      target: { value: "test-only-different" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText("Las contraseñas nuevas no coinciden."),
    ).toBeInTheDocument();
    expect(accountMocks.changePassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Repite la contraseña nueva"), {
      target: { value: TEST_NEW_PASSWORD },
    });
    accountMocks.changePassword.mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText(/Cambiamos tu contraseña/),
    ).toBeInTheDocument();
    expect(accountMocks.changePassword).toHaveBeenCalledWith({
      password: TEST_PASSWORD,
      newPassword: TEST_NEW_PASSWORD,
    });
  });

  it("asks for the app code when the account has 2FA", async () => {
    authMocks.getMe.mockResolvedValue({ ...user, mfaEnabled: true });
    accountMocks.requestEmailChange.mockResolvedValue(undefined);
    renderSections();

    fireEvent.click(
      await screen.findByRole("button", { name: "Cambiar correo" }),
    );
    fireEvent.change(screen.getByLabelText("Correo nuevo"), {
      target: { value: " nueva@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Tu contraseña actual"), {
      target: { value: TEST_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(
      await screen.findByText("Ingresa los 6 dígitos que muestra tu app."),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Código de tu app de autenticación"),
      { target: { value: "123 456" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(
      await screen.findByText(/Te enviamos un enlace a nueva@example.com/),
    ).toBeInTheDocument();
    expect(accountMocks.requestEmailChange).toHaveBeenCalledWith({
      password: TEST_PASSWORD,
      code: "123456",
      newEmail: "nueva@example.com",
    });
  });

  it("explains open bookings and deletes once confirmed", async () => {
    accountMocks.deleteAccount
      .mockRejectedValueOnce(
        new ApiError(409, "ACCOUNT_HAS_OPEN_BOOKINGS", "open", {
          openBookings: 2,
        }),
      )
      .mockResolvedValueOnce(undefined);
    renderSections();

    fireEvent.click(
      await screen.findByRole("button", { name: "Eliminar mi cuenta" }),
    );
    fireEvent.change(screen.getByLabelText("Tu contraseña actual"), {
      target: { value: TEST_PASSWORD },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar definitivamente" }),
    );
    expect(
      await screen.findByText("Escribe ELIMINAR para confirmar."),
    ).toBeInTheDocument();
    expect(accountMocks.deleteAccount).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Escribe ELIMINAR para confirmar"), {
      target: { value: "ELIMINAR" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar definitivamente" }),
    );
    expect(
      await screen.findByText(/Tienes 2 reservas pendientes/),
    ).toBeInTheDocument();

    authMocks.getMe.mockRejectedValue(new ApiError(401, "AUTH_REQUIRED", ""));
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar definitivamente" }),
    );

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/login"));
    expect(accountMocks.deleteAccount).toHaveBeenLastCalledWith({
      password: TEST_PASSWORD,
      confirmation: "ELIMINAR",
    });
  });

  it("does not offer deletion to an admin", async () => {
    authMocks.getMe.mockResolvedValue({
      ...user,
      role: "admin",
      mfaEnabled: true,
    });
    renderSections();

    expect(
      await screen.findByText(/no se pueden eliminar desde aquí/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar mi cuenta" }),
    ).not.toBeInTheDocument();
  });
});
