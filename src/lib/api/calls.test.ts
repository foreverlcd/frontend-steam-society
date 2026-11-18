import { afterEach, describe, expect, it, vi } from "vitest";
import { getCall, openCallEvents, sendCallSignal } from "./calls";

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("calls API", () => {
  it("loads the call of a booking", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ open: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCall("booking 1")).resolves.toEqual({ open: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/v1/bookings/booking%201/call",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("posts a signal as JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ delivered: true }));
    vi.stubGlobal("fetch", fetchMock);
    const signal = { kind: "candidate" as const, candidate: null };

    await expect(sendCallSignal("b1", signal)).resolves.toEqual({
      delivered: true,
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/v1/bookings/b1/call/signal");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(signal));
  });

  it("opens the event stream with the session cookie", () => {
    const EventSourceMock = vi.fn();
    vi.stubGlobal("EventSource", EventSourceMock);

    openCallEvents("b1");

    expect(EventSourceMock).toHaveBeenCalledWith(
      "http://localhost:3000/v1/bookings/b1/call/events",
      { withCredentials: true },
    );
  });
});
