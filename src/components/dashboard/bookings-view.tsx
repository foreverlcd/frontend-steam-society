"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportDialog } from "@/components/safety/report-dialog";
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
import { getPaymentsConfig, startCheckout } from "@/lib/api/payments";
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

function statusLabel(booking: Booking): string {
  if (booking.status === "no_show" && booking.noShowParty) {
    return booking.noShowParty === "mentor"
      ? "No asistió la mentora"
      : "No asistió la mentorada";
  }

  return STATUS_LABELS[booking.status];
}

function paymentResult(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("payment");
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function formatPrice(booking: Booking): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: booking.currency,
  }).format(booking.priceMinor / 100);
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
  // Returning from a checkout: `?payment=paid|failed`. BookingsView only
  // renders client-side (behind RequireAuth), so reading the URL is safe.
  const [error, setError] = useState<string | null>(() =>
    paymentResult() === "failed"
      ? "El pago no se completó. Puedes intentarlo de nuevo."
      : null,
  );
  const [notice, setNotice] = useState<string | null>(() =>
    paymentResult() === "paid"
      ? "Pago recibido. Tu reserva quedará confirmada en un momento."
      : null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [meetingUrls, setMeetingUrls] = useState<Record<string, string>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [reporting, setReporting] = useState<Booking | null>(null);
  // null while the payments config is loading.
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // Payments are optional: if the config cannot be read, hide the button.
    void getPaymentsConfig(controller.signal)
      .then((config) => {
        if (!controller.signal.aborted) {
          setPaymentsEnabled(config.enabled);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPaymentsEnabled(false);
        }
      });

    return () => controller.abort();
  }, []);

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

  async function handlePay(booking: Booking) {
    setBusyId(booking.id);
    setError(null);
    setNotice(null);

    try {
      const checkout = await startCheckout(booking.id);
      // Only leave the site for an https checkout (or our own fake one).
      const target = new URL(checkout.checkoutUrl, window.location.origin);
      if (
        target.protocol !== "https:" &&
        target.origin !== window.location.origin
      ) {
        throw new Error("Unsafe checkout URL");
      }
      window.location.assign(target.toString());
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setError(getErrorMessage(caught));
      setBusyId(null);
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

    const meetingUrl = meetingUrls[booking.id]?.trim();

    if (action === "accept" && meetingUrl && !isHttpsUrl(meetingUrl)) {
      setNotice(null);
      setError("El enlace de la sesión debe empezar con https://");
      return;
    }

    if (
      action === "no-show" &&
      typeof window !== "undefined" &&
      !window.confirm(
        role === "mentor"
          ? "¿Confirmas que la mentorada no asistió?"
          : "¿Confirmas que la mentora no asistió?",
      )
    ) {
      return;
    }

    setBusyId(booking.id);
    setError(null);
    setNotice(null);

    try {
      const updated =
        action === "accept"
          ? await acceptBooking(booking.id, meetingUrl)
          : action === "complete"
            ? await completeBooking(booking.id)
            : await noShowBooking(booking.id);

      replaceBooking(updated);
      setNotice(
        action === "accept"
          ? updated.status === "awaiting_payment"
            ? "Reserva aceptada. Queda pendiente del pago de la mentorada."
            : "Reserva aceptada."
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

      {paymentsEnabled !== null ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.filter(
            (option) => paymentsEnabled || option.value !== "awaiting_payment",
          ).map((option) => (
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
      ) : null}

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
        <div className="border-line text-muted mt-6 rounded-2xl border border-dashed px-5 py-8 text-sm">
          {filter ? (
            <p>No hay reservas en este estado.</p>
          ) : role === "mentee" ? (
            <div className="space-y-3">
              <p>Aún no tienes reservas.</p>
              <Link
                href="/mentors"
                className={buttonClassName({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                Explorar mentoras
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                Aún no tienes solicitudes. Revisa que tus ofertas y tu
                disponibilidad estén completas.
              </p>
              <Link
                href="/dashboard/availability"
                className={buttonClassName({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                Ir a disponibilidad
              </Link>
            </div>
          )}
        </div>
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
                    {statusLabel(booking)}
                  </Badge>
                </div>
                <p className="text-muted mt-1 text-sm">
                  Con {counterpartName(booking, role)} ·{" "}
                  {formatDateTime(booking.session.startsAt)}
                </p>
                <p className="text-muted mt-1 text-xs">
                  {booking.offering.durationMinutes} min ·{" "}
                  {booking.offering.isFree ? "Gratis" : formatPrice(booking)}
                </p>
              </div>

              {booking.status === "confirmed" ? (
                <div className="flex flex-col items-end gap-1.5">
                  <Link
                    href={`/call/${booking.id}`}
                    className={buttonClassName({ size: "sm" })}
                  >
                    Entrar a la videollamada
                  </Link>
                  {booking.session.meetingUrl ? (
                    <a
                      href={booking.session.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 text-xs font-semibold underline"
                    >
                      Enlace alternativo
                    </a>
                  ) : null}
                </div>
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

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setReporting(booking)}
                className="text-muted hover:text-danger-700 text-xs underline"
              >
                Reportar o bloquear
              </button>
            </div>

            {role === "mentor" && booking.status === "requested" ? (
              <div className="mt-4 space-y-2">
                <div className="max-w-md space-y-1.5">
                  <label
                    htmlFor={`meeting-${booking.id}`}
                    className="text-ink block text-xs font-medium"
                  >
                    Enlace alternativo (opcional)
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
                  <p className="text-muted text-xs">
                    La sesión se hace en la videollamada de Steam Society. Si
                    quieres, deja un enlace de otra plataforma por si falla.
                  </p>
                  {booking.offering.isFree ? null : (
                    <p className="text-muted text-xs">
                      Al aceptar, la reserva queda pendiente del pago de la
                      mentorada y se confirma cuando el pago se acredita.
                    </p>
                  )}
                </div>
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
                      La mentorada no asistió
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busyId === booking.id}
                    onClick={() => void handleAction(booking, "no-show")}
                  >
                    La mentora no asistió
                  </Button>
                )}
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
              <div className="mt-4 space-y-2">
                {booking.status === "awaiting_payment" &&
                paymentsEnabled === false ? (
                  <p className="text-muted text-xs">
                    El pago en línea todavía no está disponible.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {booking.status === "awaiting_payment" &&
                  paymentsEnabled === true ? (
                    <Button
                      type="button"
                      size="sm"
                      loading={busyId === booking.id}
                      onClick={() => void handlePay(booking)}
                    >
                      Pagar {formatPrice(booking)}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={busyId === booking.id}
                    onClick={() => void handleAction(booking, "cancel")}
                  >
                    Cancelar solicitud
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {reporting ? (
        <ReportDialog
          person={{
            id: role === "mentee" ? reporting.mentor.id : reporting.mentee.id,
            name: counterpartName(reporting, role),
          }}
          bookingId={reporting.id}
          onClose={() => setReporting(null)}
          onBlocked={(cancelled) => {
            if (cancelled > 0) setReloadKey((key) => key + 1);
          }}
        />
      ) : null}

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
