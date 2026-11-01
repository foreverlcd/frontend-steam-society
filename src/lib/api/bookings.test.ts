import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  createBooking,
  declineBooking,
  getBooking,
  listBookings,
  noShowBooking,
} from "./bookings";

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

describe("bookings API", () => {
  it("creates a booking with POST and a JSON body", async () => {
    const body = { id: "booking-1", status: "requested" };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      offeringId: "offering-1",
      startsAt: "2026-11-03T15:00:00.000Z",
      message: "Quiero preparar una entrevista.",
    };

    await expect(createBooking(input)).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/bookings$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(input);
  });

  it("lists bookings with status and cursor filters", async () => {
    const body = { items: [], nextCursor: null };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await listBookings({ status: "confirmed", limit: 20, cursor: "b-1" });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/bookings\?status=confirmed&limit=20&cursor=b-1$/);
  });

  it("loads one booking by encoded id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await getBooking("booking/1");

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/bookings\/booking%2F1$/);
  });

  it("accepts a booking with an optional meeting URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await acceptBooking("booking-1", "https://meet.example.com/sesion");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/bookings\/booking-1\/accept$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      meetingUrl: "https://meet.example.com/sesion",
    });
  });

  it("declines and cancels with an optional reason", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await declineBooking("booking-1", "Sin cupo");
    await cancelBooking("booking-1");

    const [, declineInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [, cancelInit] = fetchMock.mock.calls[1] as [string, RequestInit];

    expect(JSON.parse(String(declineInit.body))).toEqual({
      reason: "Sin cupo",
    });
    expect(JSON.parse(String(cancelInit.body))).toEqual({});
  });

  it("completes and marks no-show with POST and no body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await completeBooking("booking-1");
    await noShowBooking("booking-1");

    const [completeUrl, completeInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const [noShowUrl, noShowInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];

    expect(completeUrl).toMatch(/\/bookings\/booking-1\/complete$/);
    expect(noShowUrl).toMatch(/\/bookings\/booking-1\/no-show$/);
    expect(completeInit.body).toBeUndefined();
    expect(noShowInit.body).toBeUndefined();
  });
});
