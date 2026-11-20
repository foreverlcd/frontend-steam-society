import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { GuardianConsentView } from "./guardian-consent-view";

const authMocks = vi.hoisted(() => ({ confirmGuardianConsent: vi.fn() }));
const searchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock("@/lib/api/auth", () => authMocks);
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.value,
}));

describe("GuardianConsentView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.value = new URLSearchParams("token=abc123");
  });

  it("only authorizes on an explicit click", async () => {
    authMocks.confirmGuardianConsent.mockResolvedValue(undefined);
    render(<GuardianConsentView />);

    expect(screen.getByText(/Qué autorizas/)).toBeInTheDocument();
    expect(authMocks.confirmGuardianConsent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Autorizo" }));

    expect(
      await screen.findByText(/La cuenta quedó autorizada/),
    ).toBeInTheDocument();
    expect(authMocks.confirmGuardianConsent).toHaveBeenCalledWith("abc123");
  });

  it("explains an invalid or used link", async () => {
    authMocks.confirmGuardianConsent.mockRejectedValue(
      new ApiError(400, "INVALID_GUARDIAN_TOKEN", "Invalid"),
    );
    render(<GuardianConsentView />);

    fireEvent.click(screen.getByRole("button", { name: "Autorizo" }));

    await waitFor(() =>
      expect(screen.getByText(/no es válido, ya se usó/)).toBeInTheDocument(),
    );
  });

  it("does not offer the button without a token", () => {
    searchParams.value = new URLSearchParams();
    render(<GuardianConsentView />);

    expect(screen.getByText(/no está completo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Autorizo" })).toBeNull();
  });
});
