import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { formatSecretForManualEntry, SecurityView } from "./security-view";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));
const mfaMocks = vi.hoisted(() => ({
  getMfaStatus: vi.fn(),
  startTotpSetup: vi.fn(),
  confirmTotpSetup: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
  disableMfa: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => authMocks);
vi.mock("@/lib/api/mfa", () => mfaMocks);
const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

// Test fixtures only (the key is the public RFC sample, not a real secret).
const FAKE_TOTP_KEY = "JBSWY3DPEHPK3PXP";
const TEST_PASSWORD = "test-only-password";

const user = {
  id: "user-1",
  email: "ada@example.com",
  role: "mentor" as const,
  status: "active" as const,
  firstName: "Ada",
  lastName: null,
  birthDate: "1990-01-01",
  emailVerified: true,
  mfaEnabled: false,
  guardianConsentPending: false,
};

function renderView() {
  return render(
    <AuthProvider>
      <SecurityView />
    </AuthProvider>,
  );
}

describe("SecurityView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getMe.mockResolvedValue(user);
    navigation.params = new URLSearchParams();
  });

  it("sends an enrolling admin to the panel only after the session knows 2FA is on", async () => {
    navigation.params = new URLSearchParams("required=1");
    authMocks.getMe.mockResolvedValueOnce({ ...user, role: "admin" });
    authMocks.getMe.mockResolvedValue({
      ...user,
      role: "admin",
      mfaEnabled: true,
      guardianConsentPending: false,
    });
    mfaMocks.getMfaStatus.mockResolvedValue({
      enabled: false,
      required: true,
      recoveryCodesRemaining: 0,
    });
    mfaMocks.startTotpSetup.mockResolvedValue({
      secret: FAKE_TOTP_KEY,
      otpauthUri: "otpauth://totp/x?secret=JBSWY3DPEHPK3PXP",
    });
    mfaMocks.confirmTotpSetup.mockResolvedValue({
      recoveryCodes: ["AAAAA-BBBBB"],
    });
    renderView();

    expect(
      await screen.findByText(/Para usar el panel de administración/),
    ).toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText("Tu contraseña"), {
      target: { value: "test-only-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activar" }));
    fireEvent.change(await screen.findByLabelText("Código de la app"), {
      target: { value: "123456" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar y activar" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Ya los guardé, ir al panel" }),
    );

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/admin"));
    expect(authMocks.getMe).toHaveBeenCalledTimes(2);
    const refreshOrder = authMocks.getMe.mock.invocationCallOrder[1];
    expect(refreshOrder).toBeLessThan(
      navigation.push.mock.invocationCallOrder[0],
    );
  });

  it("enrolls: shows the key, confirms the code and shows recovery codes once", async () => {
    mfaMocks.getMfaStatus.mockResolvedValue({
      enabled: false,
      required: false,
      recoveryCodesRemaining: 0,
    });
    mfaMocks.startTotpSetup.mockResolvedValue({
      secret: FAKE_TOTP_KEY,
      otpauthUri: "otpauth://totp/Steam%20Society:ada?secret=JBSWY3DPEHPK3PXP",
    });
    mfaMocks.confirmTotpSetup.mockResolvedValue({
      recoveryCodes: ["AAAAA-BBBBB", "CCCCC-DDDDD"],
    });
    renderView();

    fireEvent.change(await screen.findByLabelText("Tu contraseña"), {
      target: { value: "test-only-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("JBSW Y3DP EHPK 3PXP")).toBeInTheDocument();
    expect(mfaMocks.startTotpSetup).toHaveBeenCalledWith("test-only-password");
    expect(
      screen.getByRole("link", { name: /abre este enlace/i }),
    ).toHaveAttribute("href", expect.stringContaining("otpauth://"));

    fireEvent.change(screen.getByLabelText("Código de la app"), {
      target: { value: "123456" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar y activar" }),
    );

    expect(await screen.findByText("AAAAA-BBBBB")).toBeInTheDocument();
    expect(mfaMocks.confirmTotpSetup).toHaveBeenCalledWith("123456");
  });

  it("asks for the password before showing the key", async () => {
    mfaMocks.getMfaStatus.mockResolvedValue({
      enabled: false,
      required: false,
      recoveryCodesRemaining: 0,
    });
    renderView();

    fireEvent.click(await screen.findByRole("button", { name: "Activar" }));
    expect(
      await screen.findByText("Escribe tu contraseña para continuar."),
    ).toBeInTheDocument();
    expect(mfaMocks.startTotpSetup).not.toHaveBeenCalled();
  });

  it("hides the disable action for roles that must keep 2FA", async () => {
    mfaMocks.getMfaStatus.mockResolvedValue({
      enabled: true,
      required: true,
      recoveryCodesRemaining: 2,
    });
    renderView();

    expect(
      await screen.findByText(/Te quedan 2 códigos de recuperación/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desactivar" })).toBeNull();
  });

  it("disables with password and code", async () => {
    mfaMocks.getMfaStatus.mockResolvedValue({
      enabled: true,
      required: false,
      recoveryCodesRemaining: 10,
    });
    mfaMocks.disableMfa.mockResolvedValue(undefined);
    renderView();

    fireEvent.click(await screen.findByRole("button", { name: "Desactivar" }));
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: TEST_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText("Código de la app"), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    await waitFor(() => {
      expect(mfaMocks.disableMfa).toHaveBeenCalledWith({
        password: TEST_PASSWORD,
        code: "654321",
      });
    });
  });

  it("groups the manual key in blocks of four", () => {
    expect(formatSecretForManualEntry("ABCDEFGHIJ")).toBe("ABCD EFGH IJ");
  });
});
