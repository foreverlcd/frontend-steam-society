import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { GuardianConsentBanner } from "./guardian-consent-banner";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  resendGuardianConsent: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => authMocks);

const kid = {
  id: "kid-1",
  email: "kid@example.com",
  role: "mentee" as const,
  status: "active" as const,
  firstName: "Ana",
  lastName: null,
  birthDate: "2015-01-01",
  emailVerified: true,
  mfaEnabled: false,
  guardianConsentPending: true,
};

function renderBanner() {
  return render(
    <AuthProvider>
      <GuardianConsentBanner />
    </AuthProvider>,
  );
}

describe("GuardianConsentBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.resendGuardianConsent.mockResolvedValue(undefined);
  });

  it("resends the link to the same adult", async () => {
    authMocks.getMe.mockResolvedValue(kid);
    renderBanner();

    fireEvent.click(
      await screen.findByRole("button", { name: "Reenviar enlace" }),
    );

    expect(await screen.findByText(/enviamos un enlace nuevo/)).toBeTruthy();
    expect(authMocks.resendGuardianConsent).toHaveBeenCalledWith(undefined);
  });

  it("sends the link to a corrected address", async () => {
    authMocks.getMe.mockResolvedValue(kid);
    renderBanner();

    fireEvent.click(
      await screen.findByRole("button", { name: "Cambiar correo" }),
    );
    fireEvent.change(
      screen.getByLabelText("Correo correcto de tu madre, padre o tutor"),
      { target: { value: " parent@example.com " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(await screen.findByText(/enviamos un enlace nuevo/)).toBeTruthy();
    expect(authMocks.resendGuardianConsent).toHaveBeenCalledWith(
      "parent@example.com",
    );
  });

  it("stays hidden once the adult authorized", async () => {
    authMocks.getMe.mockResolvedValue({
      ...kid,
      guardianConsentPending: false,
    });
    const { container } = renderBanner();

    await vi.waitFor(() => expect(authMocks.getMe).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
