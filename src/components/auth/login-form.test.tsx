import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LoginForm } from "./login-form";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
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
  emailVerified: true,
  mfaEnabled: false,
  guardianConsentPending: false,
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

  it("asks for the authenticator code when the account has 2FA", async () => {
    authMocks.login.mockResolvedValue({ mfaRequired: true });
    authMocks.loginWithSecondFactor.mockResolvedValue({
      ...user,
      mfaEnabled: true,
      guardianConsentPending: false,
    });
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

    const codeInput = await screen.findByLabelText("Código de verificación");
    fireEvent.change(codeInput, { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresa los 6 dígitos",
    );
    expect(authMocks.loginWithSecondFactor).not.toHaveBeenCalled();

    fireEvent.change(codeInput, { target: { value: "123 456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => {
      expect(authMocks.loginWithSecondFactor).toHaveBeenCalledWith({
        code: "123456",
      });
    });
  });

  it("accepts a recovery code instead of the app code", async () => {
    authMocks.login.mockResolvedValue({ mfaRequired: true });
    authMocks.loginWithSecondFactor.mockResolvedValue(user);
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

    fireEvent.click(
      await screen.findByRole("button", {
        name: /usar un código de recuperación/i,
      }),
    );
    fireEvent.change(screen.getByLabelText("Código de recuperación"), {
      target: { value: "ABCDE-FGHIJ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() => {
      expect(authMocks.loginWithSecondFactor).toHaveBeenCalledWith({
        recoveryCode: "ABCDE-FGHIJ",
      });
    });
  });

  it("offers to start over when the 2FA step expired", async () => {
    authMocks.login.mockResolvedValue({ mfaRequired: true });
    authMocks.loginWithSecondFactor.mockRejectedValue(
      new ApiError(401, "MFA_CHALLENGE_EXPIRED", "expired"),
    );
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
    fireEvent.change(await screen.findByLabelText("Código de verificación"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    fireEvent.click(
      await screen.findByRole("button", { name: "Volver a iniciar sesión" }),
    );
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
  });
});
