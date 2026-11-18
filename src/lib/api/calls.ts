import { apiFetch, apiUrl } from "./client";

export interface CallInfo {
  bookingId: string;
  role: "mentee" | "mentor";
  offeringTitle: string;
  peerName: string;
  startsAt: string;
  endsAt: string;
  opensAt: string;
  closesAt: string;
  open: boolean;
  /** External link the mentor may have shared, as a plan B. */
  meetingUrl: string | null;
  iceServers: RTCIceServer[];
}

export type CallSignal =
  | {
      kind: "description";
      description: { type: "offer" | "answer" | "rollback"; sdp?: string };
    }
  | {
      kind: "candidate";
      candidate: {
        candidate: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
        usernameFragment?: string | null;
      } | null;
    };

export type CallEvent =
  | { type: "ready"; peerPresent: boolean }
  | { type: "peer-joined" }
  | { type: "peer-left" }
  | { type: "signal"; data: CallSignal }
  | { type: "replaced" }
  | { type: "ping" };

const callPath = (bookingId: string) =>
  `/bookings/${encodeURIComponent(bookingId)}/call`;

export function getCall(
  bookingId: string,
  signal?: AbortSignal,
): Promise<CallInfo> {
  return apiFetch<CallInfo>(callPath(bookingId), { signal });
}

export function sendCallSignal(
  bookingId: string,
  data: CallSignal,
): Promise<{ delivered: boolean }> {
  return apiFetch<{ delivered: boolean }>(`${callPath(bookingId)}/signal`, {
    method: "POST",
    json: data,
  });
}

/** Server-sent events of the call; the session cookie authenticates it. */
export function openCallEvents(bookingId: string): EventSource {
  return new EventSource(apiUrl(`${callPath(bookingId)}/events`), {
    withCredentials: true,
  });
}
