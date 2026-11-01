import { afterEach, describe, expect, it, vi } from "vitest";
import { getProfile, submitMentorProfile, updateProfile } from "./profiles";

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

describe("profiles API", () => {
  it("loads the current profile", async () => {
    const body = { role: "mentee", profile: null };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getProfile()).resolves.toEqual(body);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/profile$/);
  });

  it("updates the profile with PUT", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body: {} }));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      headline: "Ingeniera de software",
      areaIds: ["area-1"],
      languageCodes: ["es"],
    };

    await updateProfile(input);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/profile$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual(input);
  });

  it("submits a mentor profile with POST and no body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await submitMentorProfile();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/profile\/submit$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });
});
