import { afterEach, describe, expect, it, vi } from "vitest";
import { getOnboarding, updateOnboarding } from "./onboarding";

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

describe("onboarding API", () => {
  it("loads the current onboarding", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { version: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    await getOnboarding();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/me\/onboarding$/),
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("updates onboarding with PUT and partial answers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { version: 1 } }));
    vi.stubGlobal("fetch", fetchMock);

    await updateOnboarding({
      version: 1,
      answers: { city: "Lima" },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/onboarding$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({
      version: 1,
      answers: { city: "Lima" },
    });
  });
});
