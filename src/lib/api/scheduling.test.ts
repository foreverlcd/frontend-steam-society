import { afterEach, describe, expect, it, vi } from "vitest";
import {
  archiveOffering,
  createOffering,
  getAvailability,
  getMentorSlots,
  listOfferings,
  replaceAvailability,
  updateOffering,
} from "./scheduling";

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

describe("scheduling API", () => {
  it("lists the mentor offerings", async () => {
    const body = { items: [{ id: "offering-1" }] };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listOfferings()).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/offerings$/);
    expect(init).toMatchObject({
      credentials: "include",
      cache: "no-store",
    });
  });

  it("creates an offering with POST and a JSON body", async () => {
    const body = { id: "offering-1" };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      title: "Mentoría de introducción",
      durationMinutes: 60,
      isFree: true,
    };

    await expect(createOffering(input)).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/offerings$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(input);
  });

  it("updates an offering with PATCH", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { id: "offering-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await updateOffering("offering-1", {
      isFree: false,
      priceMinor: 5000,
      currency: "PEN",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/offerings\/offering-1$/);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({
      isFree: false,
      priceMinor: 5000,
      currency: "PEN",
    });
  });

  it("archives an offering with POST and no body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { id: "offering-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await archiveOffering("offering-1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/offerings\/offering-1\/archive$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("loads the mentor availability", async () => {
    const body = {
      timezone: "America/Lima",
      rules: [
        {
          id: "rule-1",
          weekday: 1,
          startTime: "09:00",
          endTime: "11:00",
          timezone: "America/Lima",
          validFrom: null,
          validTo: null,
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAvailability()).resolves.toEqual(body);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/availability$/);
  });

  it("replaces the availability rules with PUT", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { timezone: "America/Lima" } }));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      rules: [
        {
          weekday: 1 as const,
          startTime: "09:00",
          endTime: "11:00",
          validFrom: "2026-10-26",
          validTo: null,
        },
      ],
    };

    await replaceAvailability(input);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/me\/availability$/);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual(input);
  });

  it("builds the public slots query with encoded parameters", async () => {
    const body = {
      mentorId: "mentor-1",
      offeringId: "offering-1",
      durationMinutes: 60,
      slots: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    const query = {
      offeringId: "offering-1",
      from: "2026-10-28T00:00:00.000Z",
      to: "2026-10-29T00:00:00.000Z",
    };

    await expect(getMentorSlots("mentor-1", query)).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);

    expect(parsed.pathname).toMatch(/\/mentors\/mentor-1\/slots$/);
    expect(parsed.searchParams.get("offeringId")).toBe(query.offeringId);
    expect(parsed.searchParams.get("from")).toBe(query.from);
    expect(parsed.searchParams.get("to")).toBe(query.to);
    expect(init.method).toBeUndefined();
  });
});
