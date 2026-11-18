"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getAdminUser,
  listAdminUsers,
  type AdminUserDetail,
  type AdminUserStatus,
  type AdminUsersQuery,
} from "@/lib/api/admin";
import { reactivateUser, suspendUser } from "@/lib/api/admin-reports";
import { BOOKING_STATUSES } from "@/lib/api/bookings";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import type { UserRole } from "@/lib/api/types";
import {
  BOOKING_STATUS_LABELS,
  historyActionLabel,
  historyReason,
  sumCounts,
} from "@/lib/admin/labels";
import { MENTOR_STATUS_LABELS } from "@/lib/admin/mentor-review";
import { useAdminResource, usePagedList } from "@/lib/admin/use-admin-data";
import { useAuth } from "@/lib/auth/auth-context";
import { roleLabel, userStatusLabel } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/catalog/format";
import { cn } from "@/lib/cn";
import {
  AdminPage,
  AdminPageHeader,
  EmptyBlock,
  ErrorBlock,
  FIELD_CLASS,
  LoadingBlock,
  LoadMore,
  PANEL_CLASS,
  ReasonField,
  userStatusTone,
} from "./admin-shared";

const ROLE_OPTIONS: Array<{ value: UserRole | ""; label: string }> = [
  { value: "", label: "Todos los roles" },
  { value: "mentee", label: "Mentoradas" },
  { value: "mentor", label: "Mentoras" },
  { value: "admin", label: "Administración" },
];

const STATUS_OPTIONS: Array<{ value: AdminUserStatus | ""; label: string }> = [
  { value: "", label: "Todos los estados" },
  { value: "active", label: "Activas" },
  { value: "pending_verification", label: "Pendientes de verificación" },
  { value: "suspended", label: "Suspendidas" },
];

const SUSPEND_MIN = 3;
const SUSPEND_MAX = 500;

type ActionStep =
  "idle" | "suspend-reason" | "suspend-confirm" | "reactivate-confirm";

function scrollToDetail(element: HTMLElement | null) {
  if (
    element &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 1023px)").matches
  ) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function AdminPeopleView() {
  const { refresh } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<AdminUsersQuery>({});
  const list = usePagedList(listAdminUsers, query);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useAdminResource(getAdminUser, selectedId);
  const detailRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<ActionStep>("idle");
  const [reason, setReason] = useState("");
  const [showReasonError, setShowReasonError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  function resetAction() {
    setStep("idle");
    setReason("");
    setShowReasonError(false);
    setActionError(null);
  }

  function updateQuery(next: AdminUsersQuery) {
    setQuery(next);
    setSelectedId(null);
    setActionSuccess(null);
    resetAction();
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ ...query, q: search.trim() || undefined });
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setActionSuccess(null);
    resetAction();
    scrollToDetail(detailRef.current);
  }

  async function runAction(request: () => Promise<string>): Promise<void> {
    if (busy) {
      return;
    }

    setBusy(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const message = await request();
      setActionSuccess(message);
      setStep("idle");
      setReason("");
      setShowReasonError(false);
      detail.reload();
      list.reload();
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setActionError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function handleReasonNext() {
    if (reason.trim().length < SUSPEND_MIN) {
      setShowReasonError(true);
      return;
    }

    setStep("suspend-confirm");
  }

  function handleSuspend(person: AdminUserDetail) {
    void runAction(async () => {
      const result = await suspendUser(person.id, reason.trim());

      return result.cancelledBookings > 0
        ? `Cuenta suspendida. Se cancelaron ${result.cancelledBookings} reservas abiertas y se avisó a las otras personas.`
        : "Cuenta suspendida. No tenía reservas abiertas.";
    });
  }

  function handleReactivate(person: AdminUserDetail) {
    void runAction(async () => {
      await reactivateUser(person.id);

      return "Cuenta reactivada. Ya puede volver a iniciar sesión.";
    });
  }

  const person = detail.data;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Personas"
        description="Busca cuentas por nombre o correo, revisa su actividad y suspende o reactiva cuando haga falta."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section
          aria-label="Lista de personas"
          className={cn(PANEL_CLASS, "h-fit")}
        >
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="people-search"
                className="text-ink text-sm font-medium"
              >
                Buscar
              </label>
              <div className="flex gap-2">
                <input
                  id="people-search"
                  type="search"
                  value={search}
                  maxLength={100}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre o correo"
                  className={FIELD_CLASS}
                />
                <Button type="submit" variant="secondary">
                  Buscar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="people-role"
                  className="text-ink text-sm font-medium"
                >
                  Rol
                </label>
                <select
                  id="people-role"
                  value={query.role ?? ""}
                  onChange={(event) =>
                    updateQuery({
                      ...query,
                      role: (event.target.value || undefined) as
                        UserRole | undefined,
                    })
                  }
                  className={FIELD_CLASS}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="people-status"
                  className="text-ink text-sm font-medium"
                >
                  Estado
                </label>
                <select
                  id="people-status"
                  value={query.status ?? ""}
                  onChange={(event) =>
                    updateQuery({
                      ...query,
                      status: (event.target.value || undefined) as
                        AdminUserStatus | undefined,
                    })
                  }
                  className={FIELD_CLASS}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {list.status === "loading" ? (
            <LoadingBlock message="Cargando personas..." />
          ) : list.status === "error" ? (
            <ErrorBlock
              message={list.error ?? "No pudimos cargar la lista."}
              onRetry={list.reload}
            />
          ) : list.items.length === 0 ? (
            <EmptyBlock>No encontramos cuentas con esos filtros.</EmptyBlock>
          ) : (
            <>
              <ul className="mt-4 space-y-2">
                {list.items.map((item) => {
                  const selected = item.id === selectedId;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        aria-current={selected ? "true" : undefined}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition",
                          selected
                            ? "border-brand-500 bg-brand-50 ring-brand-500/20 ring-2"
                            : "border-line hover:border-brand-300 bg-white",
                        )}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="text-ink block truncate text-sm font-semibold">
                              {item.name}
                            </span>
                            <span className="text-muted mt-0.5 block truncate text-xs">
                              {item.email}
                            </span>
                          </span>
                          <Badge tone={userStatusTone(item.status)}>
                            {userStatusLabel(item.status)}
                          </Badge>
                        </span>
                        <span className="text-muted mt-2 block text-xs">
                          {roleLabel(item.role)}
                          {item.mentorStatus
                            ? ` · ${MENTOR_STATUS_LABELS[item.mentorStatus]}`
                            : ""}
                          {item.emailVerified ? "" : " · Correo sin confirmar"}
                        </span>
                      </button>
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

        <section
          ref={detailRef}
          aria-label="Detalle de la persona"
          className={cn(PANEL_CLASS, "scroll-mt-28")}
        >
          {actionSuccess ? (
            <Alert tone="success" className="mb-5">
              {actionSuccess}
            </Alert>
          ) : null}

          {detail.status === "idle" ? (
            <EmptyBlock>
              Elige una persona de la lista para ver su detalle.
            </EmptyBlock>
          ) : detail.status === "loading" ? (
            <LoadingBlock message="Cargando detalle..." />
          ) : detail.status === "error" || !person ? (
            <ErrorBlock
              message={detail.error ?? "No pudimos cargar el detalle."}
              onRetry={detail.reload}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-ink text-xl font-semibold tracking-tight">
                    {person.name}
                  </h2>
                  <p className="text-muted mt-1 text-sm break-all">
                    {person.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{roleLabel(person.role)}</Badge>
                  <Badge tone={userStatusTone(person.status)}>
                    {userStatusLabel(person.status)}
                  </Badge>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Cuenta creada"
                  value={formatDateTime(person.createdAt)}
                />
                <DetailItem label="Zona horaria" value={person.timezone} />
                <DetailItem
                  label="Correo"
                  value={person.emailVerified ? "Confirmado" : "Sin confirmar"}
                />
                <DetailItem
                  label="Verificación en dos pasos"
                  value={person.mfaEnabled ? "Activa" : "No activa"}
                />
                {person.mentorStatus ? (
                  <DetailItem
                    label="Perfil de mentora"
                    value={MENTOR_STATUS_LABELS[person.mentorStatus]}
                  />
                ) : null}
              </dl>

              <div className="border-line border-t pt-5">
                <h3 className="text-ink text-sm font-semibold">
                  Seguridad y reportes
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <CountItem
                    label="Reportes abiertos"
                    value={person.reportsAgainst.open ?? 0}
                    highlight
                  />
                  <CountItem
                    label="Reportes cerrados"
                    value={
                      (person.reportsAgainst.resolved ?? 0) +
                      (person.reportsAgainst.dismissed ?? 0)
                    }
                  />
                  <CountItem
                    label="Reportes que hizo"
                    value={person.reportsFiled}
                  />
                  <CountItem
                    label="La bloquearon"
                    value={person.blockedByCount}
                    highlight
                  />
                </dl>
              </div>

              <div className="border-line border-t pt-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-ink text-sm font-semibold">Reservas</h3>
                  <Link
                    href={`/admin/bookings?userId=${encodeURIComponent(person.id)}`}
                    className="text-brand-700 text-sm font-semibold hover:underline"
                  >
                    Ver sus reservas
                  </Link>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <BookingCounts
                    title="Como mentorada"
                    counts={person.bookingsAsMentee}
                  />
                  <BookingCounts
                    title="Como mentora"
                    counts={person.bookingsAsMentor}
                  />
                </div>
              </div>

              <div className="border-line border-t pt-5">
                <h3 className="text-ink text-sm font-semibold">Acciones</h3>

                {actionError ? (
                  <Alert tone="error" className="mt-3">
                    {actionError}
                  </Alert>
                ) : null}

                {person.role === "admin" ? (
                  <Alert tone="info" className="mt-3">
                    Las cuentas de administración no se pueden suspender desde
                    aquí.
                  </Alert>
                ) : person.status === "active" ? (
                  step === "suspend-reason" ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <ReasonField
                        id="suspend-reason"
                        label="Motivo de la suspensión"
                        value={reason}
                        onChange={setReason}
                        minLength={SUSPEND_MIN}
                        maxLength={SUSPEND_MAX}
                        showError={showReasonError}
                        placeholder="Qué pasó y por qué se suspende. Queda en el historial."
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
                          onClick={resetAction}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : step === "suspend-confirm" ? (
                    <div className="border-danger-200 bg-danger-50 mt-3 flex flex-col gap-3 rounded-2xl border p-4">
                      <p className="text-danger-700 text-sm font-semibold">
                        ¿Suspender la cuenta de {person.name}?
                      </p>
                      <ul className="text-ink list-disc space-y-1 pl-5 text-sm">
                        <li>
                          No podrá iniciar sesión y se cerrarán sus sesiones
                          abiertas.
                        </li>
                        <li>
                          Se cancelarán sus reservas abiertas y se avisará por
                          correo a las otras personas.
                        </li>
                        <li>Podrás reactivarla después desde esta pantalla.</li>
                      </ul>
                      <p className="text-muted text-sm break-words">
                        Motivo: {reason.trim()}
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="danger"
                          loading={busy}
                          onClick={() => handleSuspend(person)}
                        >
                          Sí, suspender cuenta
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => setStep("suspend-reason")}
                        >
                          Volver
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="danger"
                      className="mt-3"
                      onClick={() => {
                        setActionSuccess(null);
                        setStep("suspend-reason");
                      }}
                    >
                      Suspender cuenta
                    </Button>
                  )
                ) : person.status === "suspended" ? (
                  step === "reactivate-confirm" ? (
                    <div className="border-line bg-canvas mt-3 flex flex-col gap-3 rounded-2xl border p-4">
                      <p className="text-ink text-sm font-semibold">
                        ¿Reactivar la cuenta de {person.name}?
                      </p>
                      <p className="text-muted text-sm">
                        Podrá volver a iniciar sesión. Las reservas canceladas
                        no se recuperan.
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          loading={busy}
                          onClick={() => handleReactivate(person)}
                        >
                          Sí, reactivar cuenta
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={busy}
                          onClick={resetAction}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="mt-3"
                      onClick={() => {
                        setActionSuccess(null);
                        setStep("reactivate-confirm");
                      }}
                    >
                      Reactivar cuenta
                    </Button>
                  )
                ) : (
                  <Alert tone="info" className="mt-3">
                    Solo se pueden suspender cuentas activas. Esta cuenta aún no
                    confirmó su correo.
                  </Alert>
                )}
              </div>

              <div className="border-line border-t pt-5">
                <h3 className="text-ink text-sm font-semibold">Historial</h3>
                {person.history.length === 0 ? (
                  <p className="text-muted mt-2 text-sm">
                    Sin movimientos registrados.
                  </p>
                ) : (
                  <ol className="mt-3 space-y-3">
                    {person.history.map((entry, index) => {
                      const entryReason = historyReason(entry.metadata);

                      return (
                        <li
                          key={`${entry.at}-${index}`}
                          className="border-line rounded-2xl border px-4 py-3"
                        >
                          <p className="text-ink text-sm font-medium">
                            {historyActionLabel(entry.action)}
                          </p>
                          <p className="text-muted mt-0.5 text-xs">
                            {formatDateTime(entry.at)}
                            {entry.actorName ? ` · por ${entry.actorName}` : ""}
                          </p>
                          {entryReason ? (
                            <p className="text-muted mt-1 text-sm break-words">
                              Motivo: {entryReason}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="text-ink mt-1 text-sm break-words">{value}</dd>
    </div>
  );
}

function CountItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const alert = highlight && value > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        alert ? "border-danger-200 bg-danger-50" : "border-line",
      )}
    >
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          alert ? "text-danger-700" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function BookingCounts({
  title,
  counts,
}: {
  title: string;
  counts: AdminUserDetail["bookingsAsMentee"];
}) {
  const total = sumCounts(counts);

  return (
    <div className="border-line rounded-2xl border p-4">
      <p className="text-ink text-sm font-medium">
        {title}: <span className="tabular-nums">{total}</span>
      </p>
      {total > 0 ? (
        <ul className="text-muted mt-2 space-y-1 text-xs">
          {BOOKING_STATUSES.filter((status) => (counts[status] ?? 0) > 0).map(
            (status) => (
              <li key={status} className="flex justify-between gap-3">
                <span>{BOOKING_STATUS_LABELS[status]}</span>
                <span className="text-ink tabular-nums">{counts[status]}</span>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="text-muted mt-1 text-xs">Sin reservas.</p>
      )}
    </div>
  );
}
