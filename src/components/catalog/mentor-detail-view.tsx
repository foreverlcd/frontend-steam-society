"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createBooking, type Booking } from "@/lib/api/bookings";
import {
  getMentor,
  type CatalogMentor,
  type CatalogOffering,
} from "@/lib/api/catalog";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { getProfile, type MenteeProfile } from "@/lib/api/profiles";
import { getMentorSlots, type Slot } from "@/lib/api/scheduling";
import { useAuth } from "@/lib/auth/auth-context";
import {
  formatAreas,
  formatDateTime,
  formatLanguages,
  formatPrice,
  mentorDisplayName,
} from "@/lib/catalog/format";

type LoadStatus = "loading" | "ready" | "error";
type SlotsStatus = "idle" | "loading" | "ready" | "error";

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function dateInputToIso(value: string, endOfDay = false): string {
  const suffix = endOfDay ? "T23:59:59" : "T00:00:00";

  return new Date(`${value}${suffix}`).toISOString();
}

function groupSlotsByDay(slots: Slot[]): Array<[string, Slot[]]> {
  const groups = new Map<string, Slot[]>();

  for (const slot of slots) {
    const day = slot.localStart.slice(0, 10);
    const group = groups.get(day);

    if (group) {
      group.push(slot);
    } else {
      groups.set(day, [slot]);
    }
  }

  return [...groups.entries()];
}

function formatLocalDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return day;
  }

  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function MentorDetailView({ mentorId }: { mentorId: string }) {
  const { user, refresh } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [mentor, setMentor] = useState<CatalogMentor | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(
    null,
  );
  const [fromDate, setFromDate] = useState(() => toDateInput(today));
  const [toDate, setToDate] = useState(() => toDateInput(addDays(today, 14)));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<SlotsStatus>("loading");
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menteeProfile, setMenteeProfile] = useState<MenteeProfile | null>(
    null,
  );
  const [profileStatus, setProfileStatus] = useState<"loading" | "ready">(
    "loading",
  );

  const selectedOffering = useMemo(
    () =>
      mentor?.offerings.find(
        (offering) => offering.id === selectedOfferingId,
      ) ?? null,
    [mentor, selectedOfferingId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void getMentor(mentorId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        setMentor(data);
        setSelectedOfferingId(
          (current) =>
            current ??
            data.offerings.find((offering) => isBookable(offering))?.id ??
            null,
        );
        setStatus("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(getErrorMessage(caught, "No encontramos a esa mentora."));
        setStatus("error");
      });

    return () => controller.abort();
  }, [mentorId]);

  useEffect(() => {
    if (!user || user.role !== "mentee") {
      return;
    }

    const controller = new AbortController();

    void getProfile(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        setMenteeProfile(
          data.role === "mentee"
            ? (data.profile as MenteeProfile | null)
            : null,
        );
        setProfileStatus("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
        }

        setProfileStatus("ready");
      });

    return () => controller.abort();
  }, [refresh, user]);

  useEffect(() => {
    if (!selectedOfferingId || !fromDate || !toDate) {
      return;
    }

    const controller = new AbortController();

    void getMentorSlots(
      mentorId,
      {
        offeringId: selectedOfferingId,
        from: dateInputToIso(fromDate),
        to: dateInputToIso(toDate, true),
      },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setSlots(response.slots);
        setSlotsStatus("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setSlots([]);
        setSlotsError(
          getErrorMessage(caught, "No pudimos cargar los horarios."),
        );
        setSlotsStatus("error");
      });

    return () => controller.abort();
  }, [fromDate, mentorId, selectedOfferingId, toDate]);

  function selectOffering(id: string) {
    setSelectedOfferingId(id);
    setSlotsStatus("loading");
    setSlotsError(null);
    setSelectedSlot(null);
  }

  function handleFromDateChange(value: string) {
    setFromDate(value);
    setSlotsStatus("loading");
    setSlotsError(null);
    setSelectedSlot(null);
  }

  function handleToDateChange(value: string) {
    setToDate(value);
    setSlotsStatus("loading");
    setSlotsError(null);
    setSelectedSlot(null);
  }

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedOffering || !selectedSlot) {
      setBookingError("Elige una oferta y un horario disponible.");
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const created = await createBooking({
        offeringId: selectedOffering.id,
        startsAt: selectedSlot,
        message: message.trim() || null,
      });

      setBooking(created);
      setSlots((current) =>
        current.filter((slot) => slot.startsAt !== selectedSlot),
      );
      setSelectedSlot(null);
      setMessage("");
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setBookingError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
        <div className="text-muted flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Cargando perfil de la mentora…</span>
        </div>
      </div>
    );
  }

  if (status === "error" || !mentor) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <Alert tone="error">{error ?? "No encontramos a esa mentora."}</Alert>
        <Link
          href="/mentors"
          className={buttonClassName({
            variant: "secondary",
            className: "mt-4",
          })}
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const canBook =
    user?.role === "mentee" && profileStatus === "ready" && menteeProfile;
  const groups = groupSlotsByDay(slots);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <Link
        href="/mentors"
        className="text-muted hover:text-ink text-sm font-medium"
      >
        ← Volver al catálogo
      </Link>

      <header className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
            Perfil de mentora
          </p>
          <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {mentorDisplayName(mentor)}
          </h1>
          <p className="text-muted mt-2 text-base">
            {mentor.headline ?? "Mentora STEAM"}
          </p>
          <p className="text-muted mt-4 max-w-2xl text-sm leading-6">
            {mentor.bio ?? "Esta mentora todavía no escribió su biografía."}
          </p>
        </div>

        <aside className="border-line h-fit rounded-3xl border bg-white p-5 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted text-xs font-medium">Áreas</dt>
              <dd className="text-ink mt-1">{formatAreas(mentor)}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-medium">Idiomas</dt>
              <dd className="text-ink mt-1">{formatLanguages(mentor)}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-medium">Ubicación</dt>
              <dd className="text-ink mt-1">
                {[mentor.city, mentor.country].filter(Boolean).join(", ") ||
                  "Sin completar"}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs font-medium">Experiencia</dt>
              <dd className="text-ink mt-1">
                {mentor.yearsExperience === null
                  ? "Sin completar"
                  : `${mentor.yearsExperience} años`}
              </dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className="mt-10">
        <h2 className="text-ink text-xl font-semibold tracking-tight">
          Ofertas de mentoría
        </h2>
        {mentor.offerings.length === 0 ? (
          <p className="border-line text-muted mt-4 rounded-2xl border border-dashed px-5 py-8 text-sm">
            Esta mentora todavía no publicó ofertas activas.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {mentor.offerings.map((offering) => (
              <OfferingCard
                key={offering.id}
                offering={offering}
                selected={offering.id === selectedOfferingId}
                onSelect={() => {
                  if (isBookable(offering)) {
                    selectOffering(offering.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {selectedOffering ? (
        <section className="border-line mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-ink text-xl font-semibold tracking-tight">
                Elige un horario
              </h2>
              <p className="text-muted mt-1 text-sm">
                {selectedOffering.title} · {selectedOffering.durationMinutes}{" "}
                min · {formatPrice(selectedOffering)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-ink text-xs font-medium">Desde</span>
                <Input
                  type="date"
                  value={fromDate}
                  min={toDateInput(today)}
                  onChange={(event) => handleFromDateChange(event.target.value)}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-ink text-xs font-medium">Hasta</span>
                <Input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(event) => handleToDateChange(event.target.value)}
                />
              </label>
            </div>
          </div>

          {slotsStatus === "loading" ? (
            <div className="text-muted mt-6 flex items-center gap-3 text-sm">
              <Spinner className="size-4" />
              <span>Buscando horarios disponibles…</span>
            </div>
          ) : null}

          {slotsStatus === "error" ? (
            <Alert tone="error" className="mt-6">
              {slotsError ?? "No pudimos cargar los horarios."}
            </Alert>
          ) : null}

          {slotsStatus === "ready" && slots.length === 0 ? (
            <p className="border-line text-muted mt-6 rounded-2xl border border-dashed px-5 py-8 text-sm">
              No hay horarios disponibles en este rango. Prueba con otras
              fechas.
            </p>
          ) : null}

          {slotsStatus === "ready" && groups.length > 0 ? (
            <div className="mt-6 space-y-5">
              {groups.map(([day, daySlots]) => (
                <div key={day}>
                  <h3 className="text-ink text-sm font-semibold capitalize">
                    {formatLocalDay(day)}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startsAt)}
                        aria-pressed={selectedSlot === slot.startsAt}
                        className={
                          selectedSlot === slot.startsAt
                            ? "border-brand-600 bg-brand-600 rounded-xl border px-3 py-2 text-xs font-semibold text-white"
                            : "border-line text-ink hover:border-brand-300 hover:bg-brand-50 rounded-xl border bg-white px-3 py-2 text-xs font-semibold transition"
                        }
                      >
                        {slot.localStart.slice(11, 16)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="border-line mt-8 border-t pt-6">
            {!user ? (
              <div className="text-muted text-sm">
                <p>Inicia sesión como mentorada para reservar una sesión.</p>
                <Link
                  href="/login"
                  className={buttonClassName({ size: "sm", className: "mt-3" })}
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : null}

            {user && user.role !== "mentee" ? (
              <Alert tone="info">
                Las reservas se crean desde una cuenta de mentorada. Tu rol
                actual es{" "}
                {user.role === "mentor" ? "mentora" : "administración"}.
              </Alert>
            ) : null}

            {user?.role === "mentee" && profileStatus === "loading" ? (
              <div className="text-muted flex items-center gap-3 text-sm">
                <Spinner className="size-4" />
                <span>Comprobando tu perfil de mentorada…</span>
              </div>
            ) : null}

            {user?.role === "mentee" &&
            profileStatus === "ready" &&
            !menteeProfile ? (
              <Alert tone="info">
                Antes de reservar necesitas completar tu perfil de mentorada.{" "}
                <Link
                  href="/dashboard/profile"
                  className="font-semibold underline"
                >
                  Completar mi perfil
                </Link>
                .
              </Alert>
            ) : null}

            {canBook ? (
              <form onSubmit={handleBooking} className="space-y-4">
                <h3 className="text-ink text-base font-semibold">
                  Solicitar reserva
                </h3>
                <p className="text-muted text-sm">
                  {selectedSlot
                    ? `Horario elegido: ${formatDateTime(selectedSlot)}`
                    : "Elige un horario de la lista para continuar."}
                </p>

                {!selectedOffering.isFree ? (
                  <Alert tone="info">
                    Esta oferta es de pago. La pasarela de pagos todavía no está
                    integrada, así que la reserva quedará pendiente de pago
                    hasta que la mentora la acepte.
                  </Alert>
                ) : null}

                <div className="space-y-1.5">
                  <label
                    htmlFor="booking-message"
                    className="text-ink block text-sm font-medium"
                  >
                    Mensaje para la mentora (opcional)
                  </label>
                  <textarea
                    id="booking-message"
                    value={message}
                    maxLength={2000}
                    rows={4}
                    onChange={(event) => setMessage(event.target.value)}
                    className="border-line text-ink placeholder:text-muted/70 focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
                    placeholder="Cuéntale qué te gustaría trabajar en la sesión."
                  />
                </div>

                {bookingError ? (
                  <Alert tone="error">{bookingError}</Alert>
                ) : null}

                {booking ? (
                  <Alert tone="success">
                    Reserva creada. Estado: {booking.status}.{" "}
                    <Link
                      href="/dashboard/bookings"
                      className="font-semibold underline"
                    >
                      Ver mis reservas
                    </Link>
                    .
                  </Alert>
                ) : null}

                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!selectedSlot}
                >
                  Solicitar reserva
                </Button>
              </form>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function OfferingCard({
  offering,
  selected,
  onSelect,
}: {
  offering: CatalogOffering;
  selected: boolean;
  onSelect: () => void;
}) {
  const bookable = isBookable(offering);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!bookable}
      aria-pressed={selected}
      className={
        selected
          ? "border-brand-500 bg-brand-50 ring-brand-500/20 rounded-2xl border p-5 text-left ring-2"
          : "border-line hover:border-brand-300 rounded-2xl border bg-white p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-base font-semibold">{offering.title}</h3>
          <p className="text-muted mt-1 text-sm">
            {offering.description ?? "Sesión de mentoría."}
          </p>
        </div>
        <Badge tone={offering.isFree ? "success" : "brand"}>
          {formatPrice(offering)}
        </Badge>
      </div>
      <p className="text-muted mt-3 text-xs">
        {offering.type === "group" ? "Grupal" : "Uno a uno"} ·{" "}
        {offering.durationMinutes} min
        {offering.type === "group" ? ` · ${offering.capacity} cupos` : ""}
      </p>
      {!bookable ? (
        <p className="text-muted mt-2 text-xs font-medium">
          La reserva grupal aún no está disponible.
        </p>
      ) : null}
    </button>
  );
}

function isBookable(offering: CatalogOffering): boolean {
  return offering.type === "one_to_one" && offering.capacity === 1;
}
