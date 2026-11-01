"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  declineBooking,
  listBookings,
  noShowBooking,
  type Booking,
  type BookingStatus,
} from "@/lib/api/bookings";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDateTime } from "@/lib/catalog/format";

type LoadStatus = "loading" | "ready" | "error";

const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Solicitada",
  awaiting_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  declined: "Rechazada",
  cancelled: "Cancelada",
  expired: "Vencida",
  completed: "Completada",
  no_show: "No asistió",
};

const FILTERS: Array<{ value: BookingStatus | ""; label: string }> = [
  { value: "", label: "Todas" },
  { value: "requested", label: "Solicitadas" },
  { value: "awaiting_payment", label: "Por pagar" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

function statusTone(status: BookingStatus): BadgeTone {
  if (status === "confirmed" || status === "completed") {
    return "success";
  }

  if (status === "requested" || status === "awaiting_payment") {
    return "brand";
  }

  if (status === "declined" || status === "cancelled" || status === "expired") {
    return "danger";
  }

  return "neutral";
}

function counterpartName(booking: Booking, role: "mentee" | "mentor"): string {
  const participant = role === "mentee" ? booking.mentor : booking.mentee;

  return (
    [participant.firstName, participant.lastName].filter(Boolean).join(" ") ||
    (role === "mentee" ? "Tu mentora" : "Tu mentorada")
  );
}

export function BookingsView() {
  const { user, refresh } = useAuth();
  const role = user?.role === "mentor" ? "mentor" : "mentee";
  const [items, setItems] = useState<Booking[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingStatus | "">("");
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [meetingUrls, setMeetingUrls] = useState<Record<string, string>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void listBookings(
      { ...(filter ? { status: filter } : {}), limit: 20 },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setItems(response.items);
        setNextCursor(response.nextCursor);
        setStatus("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        setError(getErrorMessage(caught));
        setStatus("error");
      });

    return () => controller.abort();
  }, [filter, refresh, reloadKey]);

  function handleFilterChange(next: BookingStatus | "") {
    setFilter(next);
    setStatus("loading");
    setError(null);
    setNotice(null);
  }

  function handleRetry() {
    setStatus("loading");
    setError(null);
    setReloadKey((current) => current + 1);
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await listBookings({
        ...(filter ? { status: filter } : {}),
        cursor: nextCursor,
        limit: 20,
      });

      setItems((current) => [...current, ...response.items]);
      setNextCursor(response.nextCursor);
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      } else {
        setError(getErrorMessage(caught));
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleAction(
    booking: Booking,
    action: "accept" | "decline" | "cancel" | "complete" | "no-show",
  ) {
    if (
      (action === "decline" || action === "cancel") &&
      typeof window !== "undefined"
    ) {
      const label =
        action === "decline"
          ? "Motivo del rechazo (opcional):"
          : "Motivo de la cancelación (opcional):";
      const reason = window.prompt(label, "");

      if (reason === null) {
        return;
      }

      const confirmed = window.confirm(
        action === "decline"
          ? "¿Rechazar esta solicitud?"
          : "¿Cancelar esta reserva?",
      );

      if (!confirmed) {
        return;
      }

      setBusyId(booking.id);
      setError(null);
      setNotice(null);

      try {
        const updated =
          action === "decline"
            ? await declineBooking(booking.id, reason?.trim() || undefined)
            : await cancelBooking(booking.id, reason?.trim() || undefined);
        replaceBooking(updated);
        setNotice(
          action === "decline" ? "Solicitud rechazada." : "Reserva cancelada.",
        );
      } catch (caught: unknown) {
        if (isUnauthorized(caught)) {
          void refresh();
        }

        setError(getErrorMessage(caught));
      } finally {
        setBusyId(null);
      }

      return;
    }

    setBusyId(booking.id);
    setError(null);
    setNotice(null);

    try {
      const updated =
        action === "accept"
          ? await acceptBooking(booking.id, meetingUrls[booking.id]?.trim())
          : action === "complete"
            ? await completeBooking(booking.id)
            : await noShowBooking(booking.id);

      replaceBooking(updated);
      setNotice(
        action === "accept"
          ? "Reserva aceptada."
          : action === "complete"
            ? "Reserva completada."
            : "Reserva marcada como no asistida.",
      );
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  function replaceBooking(updated: Booking) {
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          {role === "mentor" ? "Mentora" : "Mentorada"}
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {role === "mentor" ? "Solicitudes y sesiones" : "Mis reservas"}
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          {role === "mentor"
            ? "Acepta solicitudes, comparte el enlace de la sesión y marca el resultado."
            : "Revisa el estado de tus solicitudes y cancela cuando lo necesites."}
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => handleFilterChange(option.value)}
            aria-pressed={filter === option.value}
            className={
              filter === option.value
                ? "bg-ink rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                : "border-line text-muted hover:bg-brand-50 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold transition"
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {notice ? (
        <Alert tone="success" className="mt-5">
          {notice}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      {status === "loading" ? (
        <div className="text-muted mt-6 flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Cargando reservas…</span>
        </div>
      ) : null}

      {status === "error" ? (
        <Button type="button" className="mt-4" onClick={handleRetry}>
          Reintentar
        </Button>
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <p className="border-line text-muted mt-6 rounded-2xl border border-dashed px-5 py-8 text-sm">
          No hay reservas en este estado.
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {items.map((booking) => (
          <li
            key={booking.id}
            className="border-line rounded-2xl border bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-ink text-base font-semibold">
                    {booking.offering.title}
                  </h2>
                  <Badge tone={statusTone(booking.status)}>
                    {STATUS_LABELS[booking.status]}
                  </Badge>
                  {booking.paymentRequired ? (
                    <Badge tone="neutral">Pago pendiente de pasarela</Badge>
                  ) : null}
                </div>
                <p className="text-muted mt-1 text-sm">
                  Con {counterpartName(booking, role)} ·{" "}
                  {formatDateTime(booking.session.startsAt)}
                </p>
                <p className="text-muted mt-1 text-xs">
                  {booking.offering.durationMinutes} min ·{" "}
                  {booking.offering.isFree
                    ? "Gratis"
                    : new Intl.NumberFormat("es-PE", {
                        style: "currency",
                        currency: booking.currency,
                      }).format(booking.priceMinor / 100)}
                </p>
              </div>

              {booking.session.meetingUrl && booking.status === "confirmed" ? (
                <a
                  href={booking.session.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 text-sm font-semibold underline"
                >
                  Abrir enlace de sesión
                </a>
              ) : null}
            </div>

            {booking.message ? (
              <p className="bg-canvas text-muted mt-3 rounded-xl px-3 py-2 text-sm">
                “{booking.message}”
              </p>
            ) : null}

            {booking.cancelReason ? (
              <p className="text-muted mt-3 text-xs">
                Motivo: {booking.cancelReason}
              </p>
            ) : null}

            {role === "mentor" && booking.status === "requested" ? (
              <div className="mt-4 space-y-2">
                {booking.offering.isFree ? (
                  <div className="max-w-md space-y-1.5">
                    <label
                      htmlFor={`meeting-${booking.id}`}
                      className="text-ink block text-xs font-medium"
                    >
                      Enlace de la sesión
                    </label>
                    <Input
                      id={`meeting-${booking.id}`}
                      type="url"
                      value={meetingUrls[booking.id] ?? ""}
                      onChange={(event) =>
                        setMeetingUrls((current) => ({
                          ...current,
                          [booking.id]: event.target.value,
                        }))
                      }
                      placeholder="https://meet.example.com/sesion"
                    />
                  </div>
                ) : (
                  <p className="text-muted text-xs">
                    Al aceptar, la reserva quedará pendiente de pago hasta que
                    exista la pasarela.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    loading={busyId === booking.id}
                    onClick={() => void handleAction(booking, "accept")}
                  >
                    Aceptar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={busyId === booking.id}
                    onClick={() => void handleAction(booking, "decline")}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ) : null}

            {booking.status === "confirmed" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {role === "mentor" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      loading={busyId === booking.id}
                      onClick={() => void handleAction(booking, "complete")}
                    >
                      Marcar completada
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busyId === booking.id}
                      onClick={() => void handleAction(booking, "no-show")}
                    >
                      No asistió
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={busyId === booking.id}
                  onClick={() => void handleAction(booking, "cancel")}
                >
                  Cancelar
                </Button>
              </div>
            ) : null}

            {role === "mentee" &&
            (booking.status === "requested" ||
              booking.status === "awaiting_payment") ? (
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  loading={busyId === booking.id}
                  onClick={() => void handleAction(booking, "cancel")}
                >
                  Cancelar solicitud
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            loading={loadingMore}
            onClick={() => void handleLoadMore()}
          >
            Cargar más
          </Button>
        </div>
      ) : null}
    </div>
  );
}
