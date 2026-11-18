import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { CallView } from "./call-view";

const mocks = vi.hoisted(() => ({ getCall: vi.fn() }));

vi.mock("@/lib/api/calls", () => ({
  getCall: mocks.getCall,
  sendCallSignal: vi.fn(),
  openCallEvents: vi.fn(),
}));

const HOUR = 3_600_000;

function callInfo(overrides: Record<string, unknown> = {}) {
  const startsAt = Date.now() + 2 * HOUR;
  return {
    bookingId: "b1",
    role: "mentee",
    offeringTitle: "Primeros pasos en robótica",
    peerName: "Lucía Rojas",
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(startsAt + HOUR).toISOString(),
    opensAt: new Date(startsAt - 15 * 60_000).toISOString(),
    closesAt: new Date(startsAt + HOUR + 30 * 60_000).toISOString(),
    open: false,
    meetingUrl: null,
    iceServers: [],
    ...overrides,
  };
}

describe("CallView", () => {
  beforeEach(() => {
    mocks.getCall.mockReset();
  });

  it("says when the call opens", async () => {
    mocks.getCall.mockResolvedValue(callInfo());

    render(<CallView bookingId="b1" />);

    expect(
      await screen.findByText(/La llamada se abre el/),
    ).toBeInTheDocument();
    expect(screen.getByText("Con Lucía Rojas")).toBeInTheDocument();
  });

  it("explains a booking without a call", async () => {
    mocks.getCall.mockRejectedValue(
      new ApiError(409, "CALL_UNAVAILABLE", "Only confirmed bookings"),
    );

    render(<CallView bookingId="b1" />);

    expect(
      await screen.findByText(/aún no está confirmada o fue cancelada/),
    ).toBeInTheDocument();
  });

  it("shows the lobby with the backup link when open", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia: vi.fn(() => new Promise(() => {})) },
    });
    mocks.getCall.mockResolvedValue(
      callInfo({ open: true, meetingUrl: "https://meet.example.com/x" }),
    );

    render(<CallView bookingId="b1" />);

    expect(
      await screen.findByRole("button", { name: "Unirme a la llamada" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /enlace alternativo/ }),
    ).toHaveAttribute("href", "https://meet.example.com/x");
    vi.unstubAllGlobals();
  });
});
