import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LoginForm } from "./login-form";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
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
};

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getMe.mockRejectedValue(
      new ApiError(401, "AUTH_REQUIRED", "Authentication required"),
    );
    authMocks.login.mockResolvedValue(user);
  });

  it("submits the credentials through the auth provider", async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(authMocks.login).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "correct-horse",
      });
    });
  });

  it("shows a local validation error without calling the API", async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "no-es-un-correo" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresa un correo electrónico válido.",
    );
    expect(authMocks.login).not.toHaveBeenCalled();
  });
});
