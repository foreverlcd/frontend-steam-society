import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { EmailVerificationBanner } from "./email-verification-banner";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  resendEmailVerification: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => authMocks);

const user = {
  id: "user-1",
  email: "ada@example.com",
  role: "mentee" as const,
  status: "active" as const,
  firstName: "Ada",
  lastName: null,
  birthDate: "2000-01-01",
  emailVerified: false,
  mfaEnabled: false,
};

describe("EmailVerificationBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reminds unverified users and resends the link", async () => {
    authMocks.getMe.mockResolvedValue(user);
    authMocks.resendEmailVerification.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <EmailVerificationBanner />
      </AuthProvider>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Reenviar enlace" }),
    );

    expect(
      await screen.findByText(/Te enviamos un enlace nuevo a ada@example.com/),
    ).toBeInTheDocument();
    expect(authMocks.resendEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("stays hidden once the email is verified", async () => {
    authMocks.getMe.mockResolvedValue({ ...user, emailVerified: true });
    const { container } = render(
      <AuthProvider>
        <EmailVerificationBanner />
      </AuthProvider>,
    );

    await vi.waitFor(() => expect(authMocks.getMe).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
