"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  openCallEvents,
  sendCallSignal,
  type CallEvent,
  type CallInfo,
  type CallSignal,
} from "@/lib/api/calls";

export type CallPhase =
  /** Not in the call yet (lobby). */
  | "idle"
  /** Opening the event stream. */
  | "joining"
  /** In the call, the other person is not connected. */
  | "waiting"
  /** Both connected; WebRTC is negotiating. */
  | "connecting"
  | "connected"
  /** The media path dropped; trying to restore it. */
  | "reconnecting"
  /** The user hung up. */
  | "ended"
  /** The same account opened the call in another tab. */
  | "replaced"
  /** The server refused the stream (call over, booking cancelled...). */
  | "closed";

export interface ChatMessage {
  id: string;
  from: "me" | "peer";
  text: string;
  sentAt: number;
}

/** Longest chat message accepted, in characters. */
export const CHAT_MAX_LENGTH = 1000;

/** Messages kept on screen; older ones drop off so a flood can't freeze the tab. */
export const CHAT_HISTORY_LIMIT = 200;

/** Incoming messages accepted per second from the peer; the rest are dropped. */
export const CHAT_RATE_PER_SECOND = 5;

export function appendChat(
  current: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  const next = [...current, message];
  return next.length > CHAT_HISTORY_LIMIT
    ? next.slice(next.length - CHAT_HISTORY_LIMIT)
    : next;
}

/**
 * 1:1 WebRTC call with "perfect negotiation": both sides may offer at any
 * time and the polite one (the mentee) yields on collisions. Signals go
 * through the API in order; audio and video go peer to peer.
 */
export function useCall(info: CallInfo, localStream: MediaStream | null) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatReady, setChatReady] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const localRef = useRef<MediaStream | null>(localStream);
  const screenRef = useRef<MediaStreamTrack | null>(null);
  const chatRef = useRef<RTCDataChannel | null>(null);
  const chatWindow = useRef({ start: 0, count: 0 });
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const outbox = useRef<Promise<unknown>>(Promise.resolve());
  const inbox = useRef<Promise<unknown>>(Promise.resolve());

  const { bookingId, iceServers } = info;
  const polite = info.role === "mentee";

  useEffect(() => {
    localRef.current = localStream;
  }, [localStream]);

  // Serialized: an answer must never overtake its offer.
  const send = useCallback(
    (signal: CallSignal) => {
      outbox.current = outbox.current
        .then(() => sendCallSignal(bookingId, signal))
        .catch(() => undefined);
    },
    [bookingId],
  );

  const closePeer = useCallback(() => {
    const chat = chatRef.current;
    chatRef.current = null;
    if (chat) {
      chat.onopen = null;
      chat.onclose = null;
      chat.onmessage = null;
      chat.close();
    }
    setChatReady(false);
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      pc.onnegotiationneeded = null;
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }
    setRemoteStream(null);
  }, []);

  const createPeer = useCallback(() => {
    closePeer();
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    makingOffer.current = false;
    ignoreOffer.current = false;

    const local = localRef.current;
    const audio = local?.getAudioTracks()[0];
    const camera = local?.getVideoTracks()[0];
    const video = screenRef.current ?? camera;
    if (local && audio) pc.addTrack(audio, local);
    else pc.addTransceiver("audio", { direction: "recvonly" });
    if (local && video) pc.addTrack(video, local);
    else pc.addTransceiver("video", { direction: "recvonly" });

    // Text chat goes peer to peer, like the media: the server never sees it
    // and nothing is stored. Negotiated with a fixed id, so both sides open
    // the same channel without an extra offer.
    const chat = pc.createDataChannel("chat", { negotiated: true, id: 0 });
    chatRef.current = chat;
    chat.onopen = () => setChatReady(true);
    chat.onclose = () => setChatReady(false);
    chat.onmessage = ({ data }) => {
      const now = Date.now();
      const rate = chatWindow.current;
      if (now - rate.start >= 1000) {
        rate.start = now;
        rate.count = 0;
      }
      rate.count += 1;
      if (rate.count > CHAT_RATE_PER_SECOND) return;
      const message = parseChat(data);
      if (message) setMessages((current) => appendChat(current, message));
    };

    pc.ontrack = ({ track, streams }) => {
      setRemoteStream(streams[0] ?? new MediaStream([track]));
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current = true;
        await pc.setLocalDescription();
        if (pc.localDescription) {
          send({
            kind: "description",
            description: toDescription(pc.localDescription),
          });
        }
      } catch {
        // A newer negotiation replaces this one.
      } finally {
        makingOffer.current = false;
      }
    };

    pc.onicecandidate = ({ candidate }) => {
      // `null` = this side gathered all its candidates.
      const init = candidate?.toJSON();
      send({
        kind: "candidate",
        candidate: init
          ? {
              candidate: init.candidate ?? "",
              sdpMid: init.sdpMid,
              sdpMLineIndex: init.sdpMLineIndex,
              usernameFragment: init.usernameFragment,
            }
          : null,
      });
    };

    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc) return;
      switch (pc.connectionState) {
        case "connected":
          setPhase("connected");
          break;
        case "disconnected":
          setPhase("reconnecting");
          break;
        case "failed":
          setPhase("reconnecting");
          pc.restartIce();
          break;
      }
    };
  }, [closePeer, iceServers, send]);

  const handleSignal = useCallback(
    async (signal: CallSignal) => {
      const pc = pcRef.current;
      if (!pc) return;

      if (signal.kind === "description") {
        const description = signal.description;
        const collision =
          description.type === "offer" &&
          (makingOffer.current || pc.signalingState !== "stable");
        ignoreOffer.current = !polite && collision;
        if (ignoreOffer.current) return;

        await pc.setRemoteDescription(description);
        if (description.type === "offer") {
          await pc.setLocalDescription();
          if (pc.localDescription) {
            send({
              kind: "description",
              description: toDescription(pc.localDescription),
            });
          }
        }
        return;
      }

      try {
        await pc.addIceCandidate(signal.candidate ?? undefined);
      } catch (error) {
        // Candidates of an offer we ignored are expected to fail.
        if (!ignoreOffer.current) console.warn("ICE candidate rejected", error);
      }
    },
    [polite, send],
  );

  const handleEvent = useCallback(
    (event: CallEvent) => {
      switch (event.type) {
        case "ready":
          if (event.peerPresent) {
            createPeer();
            setPhase("connecting");
          } else {
            closePeer();
            setPhase("waiting");
          }
          return;
        case "peer-joined":
          createPeer();
          setPhase("connecting");
          return;
        case "peer-left":
          closePeer();
          setPhase("waiting");
          return;
        case "signal":
          // Applied one at a time, in arrival order.
          inbox.current = inbox.current
            .then(() => handleSignal(event.data))
            .catch((error) => console.warn("Call signal failed", error));
          return;
        case "replaced":
          sourceRef.current?.close();
          sourceRef.current = null;
          closePeer();
          setPhase("replaced");
          return;
        case "ping":
          return;
      }
    },
    [closePeer, createPeer, handleSignal],
  );

  const join = useCallback(() => {
    sourceRef.current?.close();
    setPhase("joining");
    const source = openCallEvents(bookingId);
    sourceRef.current = source;

    source.onmessage = (message: MessageEvent<string>) => {
      try {
        handleEvent(JSON.parse(message.data) as CallEvent);
      } catch (error) {
        console.warn("Bad call event", error);
      }
    };
    source.onerror = () => {
      // EventSource retries on its own unless the server refused the stream.
      if (source.readyState === EventSource.CLOSED) {
        if (sourceRef.current === source) sourceRef.current = null;
        closePeer();
        setPhase((current) => (current === "replaced" ? current : "closed"));
      }
    };
  }, [bookingId, closePeer, handleEvent]);

  const stopScreenShare = useCallback(() => {
    const screen = screenRef.current;
    screenRef.current = null;
    setSharingScreen(false);
    if (!screen) return;
    screen.onended = null;
    screen.stop();
    const sender = pcRef.current
      ?.getSenders()
      .find((candidate) => candidate.track === screen);
    const camera = localRef.current?.getVideoTracks()[0] ?? null;
    void sender?.replaceTrack(camera);
  }, []);

  const startScreenShare = useCallback(async () => {
    const display = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const track = display.getVideoTracks()[0];
    if (!track) {
      display.getTracks().forEach((t) => t.stop());
      return;
    }
    screenRef.current = track;
    setSharingScreen(true);
    track.onended = () => stopScreenShare();

    const pc = pcRef.current;
    if (!pc) return;
    const sender = pc
      .getSenders()
      .find((candidate) => candidate.track?.kind === "video");
    if (sender) {
      await sender.replaceTrack(track);
    } else {
      // Joined without a camera: sending video needs a renegotiation, which
      // `negotiationneeded` starts on its own.
      const transceiver = pc
        .getTransceivers()
        .find((t) => t.receiver.track.kind === "video");
      if (transceiver) {
        transceiver.direction = "sendrecv";
        await transceiver.sender.replaceTrack(track);
      } else {
        pc.addTrack(track, display);
      }
    }
  }, [stopScreenShare]);

  const sendChat = useCallback((input: string): boolean => {
    const text = input.trim().slice(0, CHAT_MAX_LENGTH);
    const chat = chatRef.current;
    if (!text || !chat || chat.readyState !== "open") return false;
    const sentAt = Date.now();
    chat.send(JSON.stringify({ text, sentAt }));
    setMessages((current) =>
      appendChat(current, {
        id: crypto.randomUUID(),
        from: "me",
        text,
        sentAt,
      }),
    );
    return true;
  }, []);

  const leave = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    stopScreenShare();
    closePeer();
    setPhase("ended");
  }, [closePeer, stopScreenShare]);

  // Leaving the page leaves the call.
  useEffect(
    () => () => {
      sourceRef.current?.close();
      sourceRef.current = null;
      screenRef.current?.stop();
      chatRef.current?.close();
      chatRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
    },
    [],
  );

  return {
    phase,
    remoteStream,
    sharingScreen,
    messages,
    chatReady,
    sendChat,
    join,
    leave,
    startScreenShare,
    stopScreenShare,
  };
}

function toDescription(
  description: RTCSessionDescription,
): Extract<CallSignal, { kind: "description" }>["description"] {
  return {
    type: description.type as "offer" | "answer" | "rollback",
    sdp: description.sdp,
  };
}

/** Only plain text of a sane size gets in; anything else is dropped. */
export function parseChat(data: unknown): ChatMessage | null {
  if (typeof data !== "string" || data.length > CHAT_MAX_LENGTH * 4) {
    return null;
  }
  try {
    const value = JSON.parse(data) as { text?: unknown };
    if (typeof value.text !== "string") return null;
    const text = value.text.trim().slice(0, CHAT_MAX_LENGTH);
    if (!text) return null;
    // The receiver's clock decides the time shown; the peer's may be off.
    return { id: crypto.randomUUID(), from: "peer", text, sentAt: Date.now() };
  } catch {
    return null;
  }
}
