import { afterEach, describe, expect, it, vi } from "vitest";
import { login } from "./auth";
import { ApiError, apiFetch } from "./client";
import { getErrorMessage } from "./errors";

function mockResponse({
  body,
  status = 200,
}: {
  body?: unknown;
  status?: number;
}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends credentials and parses a JSON response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { id: "u1" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ id: string }>("/me");

    expect(result).toEqual({ id: "u1" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/me$/),
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("serializes JSON bodies and sets the content type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { id: "u1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await login({ email: "ada@example.com", password: "correct-horse" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(url).toMatch(/\/auth\/login$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "ada@example.com",
      password: "correct-horse",
    });
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("returns undefined for 204 responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiFetch<void>("/auth/logout", { method: "POST" }),
    ).resolves.toBeUndefined();
  });

  it("normalizes API errors by status and code", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 401,
        body: {
          statusCode: 401,
          code: "AUTH_REQUIRED",
          message: "Authentication required",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const error = await apiFetch("/me").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      code: "AUTH_REQUIRED",
      message: "Authentication required",
    });
  });

  it("joins validation messages from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        status: 400,
        body: {
          statusCode: 400,
          message: ["email: Invalid email", "password: Too short"],
          error: "Bad Request",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const error = await apiFetch("/auth/register").catch(
      (caught: unknown) => caught,
    );

    expect(error).toMatchObject({
      status: 400,
      code: "HTTP_400",
      message: "email: Invalid email password: Too short",
    });
  });

  it("wraps network failures in a NETWORK_ERROR", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    const error = await apiFetch("/me").catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });
});

describe("getErrorMessage", () => {
  it("maps business codes to Spanish copy", () => {
    expect(
      getErrorMessage(new ApiError(401, "INVALID_CREDENTIALS", "Invalid")),
    ).toBe("Correo o contraseña incorrectos.");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(getErrorMessage(new Error("boom"))).toBe(
      "Ocurrió un error inesperado. Inténtalo de nuevo.",
    );
  });
});
