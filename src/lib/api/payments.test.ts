import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPaymentsConfig,
  sendFakePaymentResult,
  startCheckout,
} from "./payments";

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("payments API", () => {
  it("reads the public payments config", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ enabled: false, provider: "disabled" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPaymentsConfig()).resolves.toEqual({
      enabled: false,
      provider: "disabled",
    });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/payments\/config$/);
  });

  it("starts a checkout for a booking", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockResponse({ checkoutUrl: "http://localhost:3001/payments/x" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await startCheckout("booking-1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/payments\/checkout$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ bookingId: "booking-1" });
  });

  it("posts a fake provider result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ received: true, duplicate: false }));
    vi.stubGlobal("fetch", fetchMock);

    await sendFakePaymentResult("fake_abc", "paid", "evt-1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/payments\/webhooks\/fake$/);
    expect(JSON.parse(String(init.body))).toEqual({
      eventId: "evt-1",
      providerRef: "fake_abc",
      outcome: "paid",
    });
  });

  it("surfaces PAYMENTS_DISABLED as an ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          mockResponse(
            { statusCode: 503, code: "PAYMENTS_DISABLED", message: "off" },
            503,
          ),
        ),
    );

    await expect(startCheckout("booking-1")).rejects.toMatchObject({
      status: 503,
      code: "PAYMENTS_DISABLED",
    });
  });
});
