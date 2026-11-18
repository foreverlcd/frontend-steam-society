"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cancelAdminBooking,
  listAdminBookings,
  type AdminBooking,
  type AdminBookingsQuery,
} from "@/lib/api/admin";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/api/bookings";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import {
  ADMIN_CANCELLABLE_STATUSES,
  BOOKING_STATUS_LABELS,
  dateRangeToIso,
} from "@/lib/admin/labels";
import { usePagedList } from "@/lib/admin/use-admin-data";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDateTime } from "@/lib/catalog/format";
import { cn } from "@/lib/cn";
import {
  AdminPage,
  AdminPageHeader,
  EmptyBlock,
  ErrorBlock,
  FIELD_CLASS,
  FilterChips,
  LoadingBlock,
  LoadMore,
  PANEL_CLASS,
  ReasonField,
} from "./admin-shared";

const CANCEL_MIN = 3;
const CANCEL_MAX = 500;

const STATUS_FILTERS: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  ...BOOKING_STATUSES.map((status) => ({
    value: status,
    label: BOOKING_STATUS_LABELS[status],
  })),
];

const CANCELLED_BY_LABELS: Record<string, string> = {
  mentee: "la mentorada",
  mentor: "la mentora",
  admin: "administración",
  system: "el sistema",
};

function bookingTone(status: BookingStatus): BadgeTone {
  if (status === "confirmed" || status === "completed") {
    return "success";
  }

  if (status === "requested" || status === "awaiting_payment") {
    return "brand";
  }

  if (status === "declined" || status === "cancelled" || status === "no_show") {
    return "danger";
  }

  return "neutral";
}

export function AdminBookingsView() {
  const { refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? undefined;
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const rangeInvalid = Boolean(fromDay && toDay && fromDay > toDay);
  const query = useMemo<AdminBookingsQuery>(
    () => ({
      status: status === "all" ? undefined : status,
      userId,
      ...(rangeInvalid ? {} : dateRangeToIso(fromDay, toDay)),
    }),
    [status, userId, fromDay, toDay, rangeInvalid],
  );
  const list = usePagedList(listAdminBookings, query);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  function resetCancel() {
    setCancellingId(null);
    setConfirming(false);
    setReason("");
    setShowReasonError(false);
    setActionError(null);
  }

  function startCancel(id: string) {
    resetCancel();
    setActionSuccess(null);
    setCancellingId(id);
  }

  function handleReasonNext() {
    if (reason.trim().length < CANCEL_MIN) {
      setShowReasonError(true);
      return;
    }

    setConfirming(true);
  }

  async function handleConfirmCancel(booking: AdminBooking) {
    if (busy) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      await cancelAdminBooking(booking.id, reason.trim());
      resetCancel();
      setActionSuccess(
        `Reserva cancelada. Avisamos por correo a ${booking.mentee.name} y ${booking.mentor.name}.`,
      );
      list.reload();
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setActionError(
        isConflict(caught)
          ? "Esta reserva ya no se puede cancelar. Recarga la lista para ver su estado actual."
          : getErrorMessage(caught),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage>
      <AdminPageHeader
        title="Reservas"
        description="Consulta las reservas del piloto y cancela una cuando haga falta. Ambas personas reciben un correo."
      />

      {actionSuccess ? (
        <Alert tone="success" className="mt-6">
          {actionSuccess}
        </Alert>
      ) : null}

      <section
        aria-label="Filtros de reservas"
        className={cn(PANEL_CLASS, "mt-8")}
      >
        <div className="flex flex-col gap-4">
          {userId ? (
            <div className="border-brand-200 bg-brand-50 flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-brand-800 text-sm">
                Mostrando solo las reservas de una persona.
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => router.replace("/admin/bookings")}
              >
                Ver todas
              </Button>
            </div>
          ) : null}
          <FilterChips
            label="Filtrar reservas por estado"
            options={STATUS_FILTERS}
            value={status}
            onChange={(next) => {
              setStatus(next);
              resetCancel();
            }}
          />
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bookings-from"
                className="text-ink text-sm font-medium"
              >
                Desde
              </label>
              <input
                id="bookings-from"
                type="date"
                value={fromDay}
                onChange={(event) => setFromDay(event.target.value)}
                aria-invalid={rangeInvalid || undefined}
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="bookings-to"
                className="text-ink text-sm font-medium"
              >
                Hasta
              </label>
              <input
                id="bookings-to"
                type="date"
                value={toDay}
                onChange={(event) => setToDay(event.target.value)}
                aria-invalid={rangeInvalid || undefined}
                aria-describedby={
                  rangeInvalid ? "bookings-range-error" : undefined
                }
                className={FIELD_CLASS}
              />
            </div>
          </div>
          {rangeInvalid ? (
            <p
              id="bookings-range-error"
              role="alert"
              className="text-danger-700 text-xs font-medium"
            >
              La fecha “Desde” debe ser anterior o igual a “Hasta”.
            </p>
          ) : (
            <p className="text-muted text-xs">
              Las fechas filtran por el inicio de la sesión.
            </p>
          )}
        </div>
      </section>

      <section aria-label="Lista de reservas" className="mt-5">
        {list.status === "loading" ? (
          <LoadingBlock message="Cargando reservas..." />
        ) : list.status === "error" ? (
          <ErrorBlock
            message={list.error ?? "No pudimos cargar las reservas."}
            onRetry={list.reload}
          />
        ) : list.items.length === 0 ? (
          <EmptyBlock>No hay reservas con esos filtros.</EmptyBlock>
        ) : (
          <>
            <ul className="space-y-3">
              {list.items.map((booking) => {
                const cancellable = ADMIN_CANCELLABLE_STATUSES.includes(
                  booking.status,
                );
                const open = cancellingId === booking.id;

                return (
                  <li key={booking.id} className={PANEL_CLASS}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-ink text-sm font-semibold break-words">
                          {booking.offeringTitle}
                        </p>
                        <p className="text-muted mt-1 text-sm">
                          {formatDateTime(booking.startsAt)}
                        </p>
                      </div>
                      <Badge
                        tone={bookingTone(booking.status)}
                        className="w-fit"
                      >
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-muted text-xs font-medium">
                          Mentorada
                        </dt>
                        <dd className="text-ink break-words">
                          {booking.mentee.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted text-xs font-medium">
                          Mentora
                        </dt>
                        <dd className="text-ink break-words">
                          {booking.mentor.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted text-xs font-medium">
                          Solicitada
                        </dt>
                        <dd className="text-ink">
                          {formatDateTime(booking.requestedAt)}
                        </dd>
                      </div>
                    </dl>
                    {booking.status === "cancelled" &&
                    (booking.cancelledBy || booking.cancelReason) ? (
                      <p className="text-muted mt-3 text-sm break-words">
                        Cancelada
                        {booking.cancelledBy
                          ? ` por ${CANCELLED_BY_LABELS[booking.cancelledBy] ?? booking.cancelledBy}`
                          : ""}
                        {booking.cancelReason
                          ? `: ${booking.cancelReason}`
                          : "."}
                      </p>
                    ) : null}

                    {cancellable && !open ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-4"
                        onClick={() => startCancel(booking.id)}
                      >
                        Cancelar reserva
                      </Button>
                    ) : null}

                    {open ? (
                      <div className="border-line mt-4 border-t pt-4">
                        {actionError ? (
                          <Alert tone="error" className="mb-3">
                            {actionError}
                          </Alert>
                        ) : null}
                        {confirming ? (
                          <div className="border-danger-200 bg-danger-50 flex flex-col gap-3 rounded-2xl border p-4">
                            <p className="text-danger-700 text-sm font-semibold">
                              ¿Cancelar esta reserva?
                            </p>
                            <p className="text-ink text-sm">
                              Se liberará el horario y enviaremos un correo a{" "}
                              {booking.mentee.name} y {booking.mentor.name} con
                              el motivo. No se puede deshacer.
                            </p>
                            <p className="text-muted text-sm break-words">
                              Motivo: {reason.trim()}
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                type="button"
                                variant="danger"
                                loading={busy}
                                onClick={() =>
                                  void handleConfirmCancel(booking)
                                }
                              >
                                Sí, cancelar reserva
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={busy}
                                onClick={() => setConfirming(false)}
                              >
                                Volver
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <ReasonField
                              id={`cancel-reason-${booking.id}`}
                              label="Motivo de la cancelación"
                              value={reason}
                              onChange={setReason}
                              minLength={CANCEL_MIN}
                              maxLength={CANCEL_MAX}
                              showError={showReasonError}
                              placeholder="Ambas personas verán este motivo en el correo."
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                type="button"
                                variant="danger"
                                onClick={handleReasonNext}
                              >
                                Continuar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={resetCancel}
                              >
                                No cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <LoadMore
              hasMore={Boolean(list.nextCursor)}
              loading={list.loadingMore}
              error={list.moreError}
              onLoadMore={() => void list.loadMore()}
            />
          </>
        )}
      </section>
    </AdminPage>
  );
}

function isConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: unknown }).status === 409
  );
}
