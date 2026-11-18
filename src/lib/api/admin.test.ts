import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildQuery,
  cancelAdminBooking,
  getAdminOverview,
  getAdminUser,
  listAdminBookings,
  listAdminUsers,
} from "./admin";

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

function stubFetch(body: unknown = {}, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body, status }));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.at(-1) as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildQuery", () => {
  it("skips undefined and empty values", () => {
    expect(buildQuery({ a: "x", b: undefined, c: "", d: 5 })).toBe("?a=x&d=5");
    expect(buildQuery({ a: undefined })).toBe("");
  });
});

describe("admin API", () => {
  it("loads the overview with credentials", async () => {
    const body = { openReports: 2 };
    const fetchMock = stubFetch(body);

    await expect(getAdminOverview()).resolves.toEqual(body);

    const [url, init] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/overview$/);
    expect(init).toMatchObject({ credentials: "include", cache: "no-store" });
  });

  it("lists users with trimmed search and filters", async () => {
    const fetchMock = stubFetch({ items: [], nextCursor: null });

    await listAdminUsers({
      q: "  ada ",
      role: "mentor",
      status: "suspended",
      limit: 20,
      cursor: "user-1",
    });

    const [url] = lastCall(fetchMock);
    expect(url).toMatch(
      /\/admin\/users\?q=ada&role=mentor&status=suspended&limit=20&cursor=user-1$/,
    );
  });

  it("lists users without a query string when there are no filters", async () => {
    const fetchMock = stubFetch({ items: [], nextCursor: null });

    await listAdminUsers({ q: "   " });

    const [url] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/users$/);
  });

  it("loads a user detail by encoded id", async () => {
    const fetchMock = stubFetch({ id: "user/1" });

    await getAdminUser("user/1");

    const [url] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/users\/user%2F1$/);
  });

  it("lists bookings with status and date range", async () => {
    const fetchMock = stubFetch({ items: [], nextCursor: null });

    await listAdminBookings({
      status: "confirmed",
      from: "2026-11-01T05:00:00.000Z",
      to: "2026-11-08T05:00:00.000Z",
    });

    const [url] = lastCall(fetchMock);
    const parsed = new URL(url);
    expect(parsed.pathname).toMatch(/\/admin\/bookings$/);
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      status: "confirmed",
      from: "2026-11-01T05:00:00.000Z",
      to: "2026-11-08T05:00:00.000Z",
    });
  });

  it("cancels a booking with a reason", async () => {
    const fetchMock = stubFetch({ id: "booking-1", status: "cancelled" });

    await expect(
      cancelAdminBooking("booking-1", "Mentora no disponible"),
    ).resolves.toEqual({ id: "booking-1", status: "cancelled" });

    const [url, init] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/bookings\/booking-1\/cancel$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      reason: "Mentora no disponible",
    });
  });

  it("normalizes a 409 into an ApiError", async () => {
    stubFetch(
      { statusCode: 409, code: "INVALID_BOOKING_TRANSITION", message: "x" },
      409,
    );

    await expect(
      cancelAdminBooking("booking-1", "Motivo"),
    ).rejects.toMatchObject({
      status: 409,
      code: "INVALID_BOOKING_TRANSITION",
    });
  });
});
