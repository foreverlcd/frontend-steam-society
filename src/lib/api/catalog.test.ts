import { afterEach, describe, expect, it, vi } from "vitest";
import { getMentor, getRecommendations, listMentors } from "./catalog";

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

describe("catalog API", () => {
  it("lists mentors with every catalog filter", async () => {
    const body = { items: [], nextCursor: null };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listMentors({
        q: "robótica",
        areaId: "area-1",
        language: "es",
        country: "PE",
        isFree: true,
        maxPriceMinor: 5000,
        currency: "PEN",
        limit: 10,
        cursor: "cursor-1",
      }),
    ).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);

    expect(parsed.pathname).toMatch(/\/mentors$/);
    expect(parsed.searchParams.get("q")).toBe("robótica");
    expect(parsed.searchParams.get("areaId")).toBe("area-1");
    expect(parsed.searchParams.get("language")).toBe("es");
    expect(parsed.searchParams.get("country")).toBe("PE");
    expect(parsed.searchParams.get("isFree")).toBe("true");
    expect(parsed.searchParams.get("maxPriceMinor")).toBe("5000");
    expect(parsed.searchParams.get("currency")).toBe("PEN");
    expect(parsed.searchParams.get("limit")).toBe("10");
    expect(parsed.searchParams.get("cursor")).toBe("cursor-1");
    expect(init).toMatchObject({ credentials: "include", cache: "no-store" });
  });

  it("loads a mentor detail with an encoded id", async () => {
    const body = { userId: "mentor-1", offerings: [] };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMentor("mentor/1")).resolves.toEqual(body);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/mentors\/mentor%2F1$/);
  });

  it("loads recommendations with an optional limit", async () => {
    const body = { items: [], meta: {} };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getRecommendations(3)).resolves.toEqual(body);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/recommendations\?limit=3$/);
  });
});
