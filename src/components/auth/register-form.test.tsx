import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/auth-context";
import { RegisterForm } from "./register-form";

const authMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginWithSecondFactor: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => authMocks);

function fill(birthDate: string) {
  render(
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>,
  );
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "new@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), {
    target: { value: birthDate },
  });
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "test-only-password-123" },
  });
  fireEvent.change(screen.getByLabelText("Repite la contraseña"), {
    target: { value: "test-only-password-123" },
  });
}

describe("RegisterForm consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getMe.mockRejectedValue(
      new ApiError(401, "AUTH_REQUIRED", "Authentication required"),
    );
    authMocks.register.mockReturnValue(new Promise(() => undefined));
  });

  it("requires accepting the terms", async () => {
    fill("2000-01-01");
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText(/acepta los términos/)).toBeTruthy();
    expect(authMocks.register).not.toHaveBeenCalled();
  });

  it("sends acceptTerms for an adult without asking a guardian", async () => {
    fill("2000-01-01");
    expect(screen.queryByLabelText(/menos de 14 años/)).toBeNull();
    fireEvent.click(screen.getByLabelText(/Acepto los/));
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(authMocks.register).toHaveBeenCalled());
    expect(authMocks.register.mock.calls[0][0]).toMatchObject({
      acceptTerms: true,
      guardianConsent: undefined,
      guardianEmail: undefined,
    });
  });

  it("asks for the guardian e-mail and consent under 14", async () => {
    const year = new Date().getFullYear() - 10;
    fill(`${year}-01-01`);
    fireEvent.click(screen.getByLabelText(/Acepto los/));
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(
      await screen.findByText(/correo válido de tu madre, padre o tutor/),
    ).toBeTruthy();

    const guardianField = screen.getByLabelText(
      "Correo de tu madre, padre o tutor",
    );
    fireEvent.change(guardianField, { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByText(/distinto del tuyo/)).toBeTruthy();

    fireEvent.change(guardianField, {
      target: { value: "parent@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByText(/debe autorizar tu registro/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText(/menos de 14 años/));
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(authMocks.register).toHaveBeenCalled());
    expect(authMocks.register.mock.calls[0][0]).toMatchObject({
      acceptTerms: true,
      guardianConsent: true,
      guardianEmail: "parent@example.com",
    });
  });
});
