import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { RequireMfaEnrollment } from "./require-mfa-enrollment";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));
const replace = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/auth", () => authMocks);
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const admin = {
  id: "admin-1",
  email: "admin@example.com",
  role: "admin" as const,
  status: "active" as const,
  firstName: null,
  lastName: null,
  birthDate: null,
  emailVerified: true,
  mfaEnabled: false,
};

function renderGuard() {
  return render(
    <AuthProvider>
      <RequireMfaEnrollment>
        <p>Panel</p>
      </RequireMfaEnrollment>
    </AuthProvider>,
  );
}

describe("RequireMfaEnrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends an admin without 2FA to the security page", async () => {
    authMocks.getMe.mockResolvedValue(admin);
    renderGuard();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/account/security?required=1");
    });
    expect(screen.queryByText("Panel")).toBeNull();
  });

  it("shows the panel once 2FA is on", async () => {
    authMocks.getMe.mockResolvedValue({ ...admin, mfaEnabled: true });
    renderGuard();

    expect(await screen.findByText("Panel")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
