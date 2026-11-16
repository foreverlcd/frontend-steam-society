import { apiFetch } from "./client";

export interface PaymentsConfig {
  enabled: boolean;
  provider: string;
}

export interface CheckoutResponse {
  paymentId: string;
  bookingId: string;
  status: "created" | "pending" | "paid" | "failed";
  provider: string;
  amountMinor: number;
  currency: string;
  checkoutUrl: string;
}

export type FakePaymentOutcome = "paid" | "failed";

export function getPaymentsConfig(
  signal?: AbortSignal,
): Promise<PaymentsConfig> {
  return apiFetch<PaymentsConfig>("/payments/config", { signal });
}

export function startCheckout(bookingId: string): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>("/payments/checkout", {
    method: "POST",
    json: { bookingId },
  });
}

/**
 * Development only: plays the provider and reports the result of a fake
 * checkout. The API refuses the fake provider in production.
 */
export function sendFakePaymentResult(
  providerRef: string,
  outcome: FakePaymentOutcome,
  eventId: string = crypto.randomUUID(),
): Promise<{ received: true; duplicate: boolean }> {
  return apiFetch("/payments/webhooks/fake", {
    method: "POST",
    json: { eventId, providerRef, outcome },
  });
}
