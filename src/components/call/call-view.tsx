"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getCall, type CallInfo } from "@/lib/api/calls";
import { isApiError } from "@/lib/api/client";
import { useCall, type CallPhase } from "@/lib/call/use-call";
import { cn } from "@/lib/cn";

/** After this long without connecting, suggest another network. */
const SLOW_CONNECT_MS = 20_000;

const timeFormat = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});
const dateTimeFormat = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; info: CallInfo; loadedAt: number };

export function CallView({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    getCall(bookingId, controller.signal)
      .then((info) => setState({ status: "ready", info, loadedAt: Date.now() }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setState({ status: "error", message: loadErrorMessage(error) });
      });
    return () => controller.abort();
  }, [bookingId, attempt]);

  // Before the call opens, check again when it does.
  const info = state.status === "ready" ? state.info : null;
  const loadedAt = state.status === "ready" ? state.loadedAt : 0;
  useEffect(() => {
    if (!info || info.open) return;
    const opensIn = new Date(info.opensAt).getTime() - loadedAt;
    if (opensIn <= 0) return;
    const timer = setTimeout(reload, Math.min(opensIn + 1_000, 60_000));
    return () => clearTimeout(timer);
  }, [info, loadedAt, reload]);

  if (state.status === "loading") {
    return (
      <Shell>
        <p className="text-muted flex items-center gap-2 text-sm">
          <Spinner /> Cargando la llamada…
        </p>
      </Shell>
    );
  }

  if (state.status === "error") {
    return (
      <Shell>
        <Alert tone="error">{state.message}</Alert>
        <BackLink />
      </Shell>
    );
  }

  const { info: call } = state;

  if (!call.open) {
    const over = state.loadedAt >= new Date(call.closesAt).getTime();
    return (
      <Shell title={call.offeringTitle} subtitle={`Con ${call.peerName}`}>
        <Alert tone="info">
          {over
            ? "Esta llamada ya terminó."
            : `La llamada se abre el ${dateTimeFormat.format(new Date(call.opensAt))}, 15 minutos antes de la sesión. Esta página se actualiza sola.`}
        </Alert>
        <BackLink />
      </Shell>
    );
  }

  return <OpenCall info={call} onRetry={reload} />;
}

function OpenCall({ info, onRetry }: { info: CallInfo; onRetry: () => void }) {
  const media = useLocalMedia();
  const call = useCall(info, media.stream);
  const slow = useSlowConnect(call.phase);

  if (call.phase === "idle") {
    return (
      <Shell title={info.offeringTitle} subtitle={`Con ${info.peerName}`}>
        <div className="grid gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center">
          <div className="bg-ink relative aspect-video overflow-hidden rounded-2xl">
            <VideoTile
              stream={media.stream}
              muted
              mirrored
              hidden={!media.cameraOn}
            />
            {!media.cameraOn ? (
              <p className="absolute inset-0 grid place-items-center text-sm text-white/80">
                {media.status === "loading"
                  ? "Activando la cámara…"
                  : "Cámara apagada"}
              </p>
            ) : null}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              <MediaToggles media={media} />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-muted text-sm">
              Sesión de {timeFormat.format(new Date(info.startsAt))} a{" "}
              {timeFormat.format(new Date(info.endsAt))}. La llamada es solo
              entre tú y {info.peerName}; no se graba.
            </p>
            {media.error ? <Alert tone="error">{media.error}</Alert> : null}
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={media.status === "loading"}
              onClick={call.join}
            >
              Unirme a la llamada
            </Button>
            {info.meetingUrl ? <Fallback url={info.meetingUrl} /> : null}
          </div>
        </div>
      </Shell>
    );
  }

  if (
    call.phase === "ended" ||
    call.phase === "replaced" ||
    call.phase === "closed"
  ) {
    const message =
      call.phase === "ended"
        ? "Saliste de la llamada."
        : call.phase === "replaced"
          ? "Abriste esta llamada en otra pestaña o dispositivo."
          : "La llamada se cerró: terminó el horario o la reserva cambió.";
    return (
      <Shell title={info.offeringTitle} subtitle={`Con ${info.peerName}`}>
        <Alert tone="info">{message}</Alert>
        <div className="flex flex-wrap gap-2">
          {call.phase === "closed" ? (
            <Button type="button" onClick={onRetry}>
              Volver a comprobar
            </Button>
          ) : (
            <Button type="button" onClick={call.join}>
              Volver a entrar
            </Button>
          )}
          <BackLink inline />
        </div>
      </Shell>
    );
  }

  const status = statusText(call.phase, info.peerName);
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getDisplayMedia === "function";

  return (
    <div className="bg-ink flex h-[calc(100dvh-4rem)] flex-col text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-semibold">{info.offeringTitle}</p>
          <p className="truncate text-white/70">
            Con {info.peerName} · hasta las{" "}
            {timeFormat.format(new Date(info.endsAt))}
          </p>
        </div>
        {call.sharingScreen ? (
          <span className="bg-brand-600 shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
            Compartiendo pantalla
          </span>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 px-4">
        <div className="relative h-full overflow-hidden rounded-2xl bg-black">
          <VideoTile stream={call.remoteStream} fit="contain" />
          {status ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-2 text-base">
                  {call.phase !== "waiting" ? <Spinner /> : null}
                  {status}
                </p>
                {slow ? (
                  <p className="mx-auto max-w-sm text-sm text-white/70">
                    No logramos conectar. Puede ser la red (datos móviles o una
                    red de trabajo). Prueba con otra red o recarga la página.
                  </p>
                ) : null}
                {slow && info.meetingUrl ? (
                  <Fallback url={info.meetingUrl} dark />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="absolute right-3 bottom-3 aspect-video w-32 overflow-hidden rounded-xl border border-white/20 bg-black shadow-lg sm:w-48">
            <VideoTile
              stream={media.stream}
              muted
              mirrored
              hidden={!media.cameraOn}
            />
            {!media.cameraOn ? (
              <p className="absolute inset-0 grid place-items-center text-xs text-white/70">
                Tu cámara está apagada
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4">
        <MediaToggles media={media} />
        {canShare ? (
          <ControlButton
            pressed={call.sharingScreen}
            label={
              call.sharingScreen ? "Dejar de compartir" : "Compartir pantalla"
            }
            onClick={() =>
              call.sharingScreen
                ? call.stopScreenShare()
                : void call.startScreenShare().catch(() => undefined)
            }
          >
            <ScreenIcon />
          </ControlButton>
        ) : null}
        <button
          type="button"
          onClick={call.leave}
          className="bg-danger-600 hover:bg-danger-700 rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Salir
        </button>
      </div>
    </div>
  );
}

interface LocalMedia {
  stream: MediaStream | null;
  status: "loading" | "ready" | "unavailable";
  error: string | null;
  micOn: boolean;
  cameraOn: boolean;
  hasMic: boolean;
  hasCamera: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
}

/** Camera and microphone, asked once when the call page opens. */
function useLocalMedia(): LocalMedia {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<LocalMedia["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let acquired: MediaStream | null = null;

    async function acquire() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        setCameraOn(false);
        setError(
          "Este navegador no permite videollamadas. Usa Chrome, Edge, Firefox o Safari actualizados.",
        );
        return;
      }
      try {
        acquired = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (first) {
        // No camera (or it is busy): try with the microphone only.
        try {
          acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
          setError(
            "No pudimos usar la cámara; entrarás solo con audio. " +
              mediaErrorHint(first),
          );
        } catch (second) {
          if (!cancelled) {
            setStatus("unavailable");
            setCameraOn(false);
            setMicOn(false);
            setError(
              `No pudimos usar la cámara ni el micrófono. ${mediaErrorHint(second)} Igual puedes entrar para ver y escuchar.`,
            );
          }
          return;
        }
      }
      if (cancelled) {
        acquired.getTracks().forEach((track) => track.stop());
        return;
      }
      setStream(acquired);
      setCameraOn(acquired.getVideoTracks().length > 0);
      setStatus("ready");
    }

    void acquire();
    return () => {
      cancelled = true;
      acquired?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const hasMic = (stream?.getAudioTracks().length ?? 0) > 0;
  const hasCamera = (stream?.getVideoTracks().length ?? 0) > 0;

  return {
    stream,
    status,
    error,
    micOn: hasMic && micOn,
    cameraOn: hasCamera && cameraOn,
    hasMic,
    hasCamera,
    toggleMic: () => {
      const next = !micOn;
      stream?.getAudioTracks().forEach((track) => (track.enabled = next));
      setMicOn(next);
    },
    toggleCamera: () => {
      const next = !cameraOn;
      stream?.getVideoTracks().forEach((track) => (track.enabled = next));
      setCameraOn(next);
    },
  };
}

function useSlowConnect(phase: CallPhase): boolean {
  const [slow, setSlow] = useState(false);
  const trying = phase === "connecting" || phase === "reconnecting";
  useEffect(() => {
    if (!trying) return;
    const timer = setTimeout(() => setSlow(true), SLOW_CONNECT_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [trying]);
  return trying && slow;
}

function MediaToggles({ media }: { media: LocalMedia }) {
  return (
    <>
      <ControlButton
        pressed={!media.micOn}
        disabled={!media.hasMic}
        label={media.micOn ? "Silenciar micrófono" : "Activar micrófono"}
        onClick={media.toggleMic}
      >
        <MicIcon off={!media.micOn} />
      </ControlButton>
      <ControlButton
        pressed={!media.cameraOn}
        disabled={!media.hasCamera}
        label={media.cameraOn ? "Apagar cámara" : "Encender cámara"}
        onClick={media.toggleCamera}
      >
        <CameraIcon off={!media.cameraOn} />
      </ControlButton>
    </>
  );
}

function ControlButton({
  pressed,
  disabled,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-12 place-items-center rounded-full transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        pressed
          ? "bg-danger-600 hover:bg-danger-700 text-white"
          : "bg-white/15 text-white hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}

function VideoTile({
  stream,
  muted = false,
  mirrored = false,
  hidden = false,
  fit = "cover",
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  hidden?: boolean;
  /** `contain` never crops (the other person, a shared screen). */
  fit?: "cover" | "contain";
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn(
        "h-full w-full",
        fit === "cover" ? "object-cover" : "object-contain",
        mirrored && "-scale-x-100",
        hidden && "invisible",
      )}
    />
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl space-y-5 px-5 py-8">
      {title ? (
        <header>
          <p className="text-brand-700 text-xs font-semibold tracking-wide uppercase">
            Videollamada
          </p>
          <h1 className="text-ink mt-1 text-2xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-muted mt-1 text-sm">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

function BackLink({ inline = false }: { inline?: boolean }) {
  return (
    <Link
      href="/dashboard/bookings"
      className={buttonClassName({
        variant: "secondary",
        className: inline ? undefined : "w-fit",
      })}
    >
      Ir a mis reservas
    </Link>
  );
}

function Fallback({ url, dark = false }: { url: string; dark?: boolean }) {
  return (
    <p className={cn("text-sm", dark ? "text-white/80" : "text-muted")}>
      ¿Problemas con la llamada?{" "}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "font-semibold underline",
          dark ? "text-white" : "text-brand-700",
        )}
      >
        Usa el enlace alternativo de la mentora
      </a>
    </p>
  );
}

function statusText(phase: CallPhase, peerName: string): string | null {
  switch (phase) {
    case "joining":
      return "Entrando…";
    case "waiting":
      return `Esperando a ${peerName}…`;
    case "connecting":
      return `Conectando con ${peerName}…`;
    case "reconnecting":
      return "Reconectando…";
    default:
      return null;
  }
}

function loadErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    switch (error.code) {
      case "BOOKING_NOT_FOUND":
      case "BOOKING_FORBIDDEN":
        return "No encontramos esta llamada o no participas en ella.";
      case "CALL_UNAVAILABLE":
        return "Esta reserva no tiene llamada: aún no está confirmada o fue cancelada.";
      case "NETWORK_ERROR":
        return "No se pudo conectar con el servidor. Revisa tu conexión.";
    }
  }
  return "No pudimos cargar la llamada. Inténtalo de nuevo.";
}

function mediaErrorHint(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") {
    return "Da permiso a la cámara y al micrófono desde el candado de la barra de direcciones y recarga la página.";
  }
  if (name === "NotFoundError") {
    return "No encontramos el dispositivo.";
  }
  if (name === "NotReadableError") {
    return "Otra aplicación lo está usando; ciérrala y recarga.";
  }
  return "";
}

function MicIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {off ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

function CameraIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3" />
      {off ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4M9 10l3-3 3 3M12 7v6" />
    </svg>
  );
}
