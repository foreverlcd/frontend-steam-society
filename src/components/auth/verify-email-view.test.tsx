import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/auth-context";
import { VerifyEmailView } from "./verify-email-view";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  verifyEmail: vi.fn(),
}));
const searchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("@/lib/api/auth", () => authMocks);
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.value,
}));

function renderView() {
  return render(
    <AuthProvider>
      <VerifyEmailView />
    </AuthProvider>,
  );
}

describe("VerifyEmailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getMe.mockRejectedValue(
      new ApiError(401, "AUTH_REQUIRED", "Authentication required"),
    );
    searchParams.value = new URLSearchParams("token=abc123");
  });

  it("only spends the single-use token on an explicit click", async () => {
    authMocks.verifyEmail.mockResolvedValue(undefined);
    renderView();

    expect(authMocks.verifyEmail).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar mi correo" }),
    );

    expect(
      await screen.findByText("Listo, tu correo quedó confirmado."),
    ).toBeInTheDocument();
    expect(authMocks.verifyEmail).toHaveBeenCalledWith("abc123");
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" }),
    ).toHaveAttribute("href", "/login");
  });

  it("explains an expired or used link", async () => {
    authMocks.verifyEmail.mockRejectedValue(
      new ApiError(400, "INVALID_VERIFICATION_TOKEN", "invalid"),
    );
    renderView();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar mi correo" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "no es válido o ya expiró",
      );
    });
  });

  it("does not offer to confirm without a token", () => {
    searchParams.value = new URLSearchParams();
    renderView();

    expect(screen.getByRole("alert")).toHaveTextContent("no está completo");
    expect(
      screen.queryByRole("button", { name: "Confirmar mi correo" }),
    ).not.toBeInTheDocument();
  });
});
