"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getReport,
  listReports,
  REPORT_STATUSES,
  resolveReport,
  type ReportDetail,
  type ReportPerson,
  type ReportStatus,
  type ResolveReportAction,
} from "@/lib/api/admin-reports";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import {
  BOOKING_STATUS_LABELS,
  REPORT_ACTION_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  RESOLVE_ACTION_LABELS,
} from "@/lib/admin/labels";
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
  LoadingBlock,
  LoadMore,
  PANEL_CLASS,
  ReasonField,
  userStatusTone,
} from "./admin-shared";

const NOTE_MAX = 1000;

const TABS: Array<{ value: ReportStatus; label: string; empty: string }> = [
  { value: "open", label: "Abiertos", empty: "No hay reportes abiertos." },
  {
    value: "resolved",
    label: "Resueltos",
    empty: "Aún no hay reportes resueltos.",
  },
  {
    value: "dismissed",
    label: "Descartados",
    empty: "Aún no hay reportes descartados.",
  },
];

const ACTIONS: ResolveReportAction[] = ["dismiss", "warn", "suspend"];

function actionDescription(action: ResolveReportAction, name: string): string {
  if (action === "dismiss") {
    return "No hay nada que hacer. No se avisa a nadie.";
  }

  if (action === "warn") {
    return `Enviamos a ${name} un correo de advertencia genérico. No dice quién reportó ni qué escribió.`;
  }

  return `Suspende la cuenta de ${name} y cancela sus reservas abiertas.`;
}

export function AdminReportsView() {
  const { refresh } = useAuth();
  const [tab, setTab] = useState<ReportStatus>("open");
  const list = usePagedList(listReports, { status: tab });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useAdminResource(getReport, selectedId);
  const detailRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [action, setAction] = useState<ResolveReportAction | null>(null);
  const [note, setNote] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  function resetForm() {
    setAction(null);
    setNote("");
    setShowErrors(false);
    setConfirming(false);
    setActionError(null);
  }

  function handleTab(next: ReportStatus) {
    setTab(next);
    setSelectedId(null);
    setActionSuccess(null);
    resetForm();
  }

  function handleTabKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const nextIndex =
      (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) %
      TABS.length;
    handleTab(TABS[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setActionSuccess(null);
    resetForm();

    const element = detailRef.current;

    if (
      element &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleContinue() {
    if (!action || !note.trim()) {
      setShowErrors(true);
      return;
    }

    setConfirming(true);
  }

  async function handleResolve(report: ReportDetail) {
    if (!action || busy) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const result = await resolveReport(report.id, {
        action,
        note: note.trim(),
      });
      resetForm();
      setActionSuccess(
        result.status === "dismissed"
          ? "Reporte descartado."
          : result.action === "warned"
            ? "Reporte resuelto. Enviamos la advertencia por correo."
            : result.action === "suspended"
              ? "Reporte resuelto. La cuenta quedó suspendida y sus reservas abiertas se cancelaron."
              : "Reporte resuelto.",
      );
      detail.reload();
      list.reload();
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setConfirming(false);
      setActionError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const report = detail.data;
  const currentTab = TABS.find((item) => item.value === tab) ?? TABS[0];

  return (
    <AdminPage>
      <AdminPageHeader
        title="Reportes"
        description="Reportes que envían mentoras y mentoradas. Los abiertos se muestran del más antiguo al más reciente."
      />

      <div
        role="tablist"
        aria-label="Estado de los reportes"
        className="border-line mt-8 flex gap-1 overflow-x-auto border-b"
      >
        {TABS.map((item, index) => {
          const selected = item.value === tab;

          return (
            <button
              key={item.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`reports-tab-${item.value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="reports-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => handleTab(item.value)}
              onKeyDown={(event) => handleTabKey(event, index)}
              className={cn(
                "focus-visible:ring-brand-500 -mb-px min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition focus-visible:ring-2 focus-visible:outline-none",
                selected
                  ? "border-brand-600 text-brand-700"
                  : "text-muted hover:text-ink border-transparent",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        id="reports-panel"
        role="tabpanel"
        aria-labelledby={`reports-tab-${tab}`}
        className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      >
        <section
          aria-label="Lista de reportes"
          className={cn(PANEL_CLASS, "h-fit")}
        >
          {list.status === "loading" ? (
            <LoadingBlock message="Cargando reportes..." />
          ) : list.status === "error" ? (
            <ErrorBlock
              message={list.error ?? "No pudimos cargar los reportes."}
              onRetry={list.reload}
            />
          ) : list.items.length === 0 ? (
            <EmptyBlock>{currentTab.empty}</EmptyBlock>
          ) : (
            <>
              <ul className="space-y-2">
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
                          <span className="text-ink text-sm font-semibold">
                            {REPORT_REASON_LABELS[item.reason]}
                          </span>
                          <span className="text-muted shrink-0 text-xs">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </span>
                        <span className="text-ink mt-2 block truncate text-sm">
                          Sobre {item.reportedUser.name}
                        </span>
                        <span className="text-muted mt-0.5 block truncate text-xs">
                          Lo envió {item.reporter.name}
                          {item.bookingId ? " · Ligado a una reserva" : ""}
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
          aria-label="Detalle del reporte"
          className={cn(PANEL_CLASS, "scroll-mt-28")}
        >
          {actionSuccess ? (
            <Alert tone="success" className="mb-5">
              {actionSuccess}
            </Alert>
          ) : null}

          {detail.status === "idle" ? (
            <EmptyBlock>
              Elige un reporte de la lista para revisarlo.
            </EmptyBlock>
          ) : detail.status === "loading" ? (
            <LoadingBlock message="Cargando reporte..." />
          ) : detail.status === "error" || !report ? (
            <ErrorBlock
              message={detail.error ?? "No pudimos cargar el reporte."}
              onRetry={detail.reload}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-ink text-xl font-semibold tracking-tight">
                    {REPORT_REASON_LABELS[report.reason]}
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    Enviado el {formatDateTime(report.createdAt)}
                  </p>
                </div>
                <Badge
                  tone={
                    report.status === "open"
                      ? "brand"
                      : report.status === "resolved"
                        ? "success"
                        : "neutral"
                  }
                  className="w-fit"
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </Badge>
              </div>

              <div>
                <h3 className="text-ink text-sm font-semibold">Lo que contó</h3>
                {report.details ? (
                  <p className="text-ink bg-canvas mt-2 rounded-2xl px-4 py-3 text-sm leading-6 break-words whitespace-pre-line">
                    {report.details}
                  </p>
                ) : (
                  <p className="text-muted mt-2 text-sm">No agregó detalles.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <PersonCard
                  title="Persona reportada"
                  person={report.reportedUser}
                >
                  <p
                    className={cn(
                      "mt-2 text-sm",
                      report.reportedUser.reportsTotal > 1
                        ? "text-danger-700 font-semibold"
                        : "text-muted",
                    )}
                  >
                    {report.reportedUser.reportsTotal === 1
                      ? "Este es su único reporte."
                      : `${report.reportedUser.reportsTotal} reportes en total, ${report.reportedUser.reportsOpen} abiertos.`}
                  </p>
                </PersonCard>
                <PersonCard title="Quién reportó" person={report.reporter} />
              </div>

              {report.booking ? (
                <div className="border-line rounded-2xl border p-4">
                  <h3 className="text-ink text-sm font-semibold">
                    Reserva relacionada
                  </h3>
                  <p className="text-ink mt-2 text-sm break-words">
                    {report.booking.offeringTitle}
                  </p>
                  <p className="text-muted mt-0.5 text-sm">
                    {formatDateTime(report.booking.startsAt)} ·{" "}
                    {BOOKING_STATUS_LABELS[report.booking.status]}
                  </p>
                  <Link
                    href={`/admin/bookings?userId=${encodeURIComponent(report.reportedUser.id)}`}
                    className="text-brand-700 mt-2 inline-block text-sm font-semibold hover:underline"
                  >
                    Ver reservas de la persona reportada
                  </Link>
                </div>
              ) : null}

              {report.status !== "open" ? (
                <div className="border-line border-t pt-5">
                  <h3 className="text-ink text-sm font-semibold">Resolución</h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted text-xs font-medium">Acción</dt>
                      <dd className="text-ink mt-1 text-sm">
                        {report.action
                          ? REPORT_ACTION_LABELS[report.action]
                          : "Sin acción"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-medium">
                        Cerrado
                      </dt>
                      <dd className="text-ink mt-1 text-sm">
                        {report.resolvedAt
                          ? formatDateTime(report.resolvedAt)
                          : "—"}
                        {report.resolvedBy
                          ? ` por ${report.resolvedBy.name}`
                          : ""}
                      </dd>
                    </div>
                  </dl>
                  {report.resolutionNote ? (
                    <p className="text-muted mt-3 text-sm break-words whitespace-pre-line">
                      Nota: {report.resolutionNote}
                    </p>
                  ) : null}
                </div>
              ) : (
                <ResolveForm
                  report={report}
                  action={action}
                  note={note}
                  showErrors={showErrors}
                  confirming={confirming}
                  busy={busy}
                  error={actionError}
                  onAction={(next) => {
                    setAction(next);
                    setConfirming(false);
                  }}
                  onNote={setNote}
                  onContinue={handleContinue}
                  onBack={() => setConfirming(false)}
                  onConfirm={() => void handleResolve(report)}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </AdminPage>
  );
}

function PersonCard({
  title,
  person,
  children,
}: {
  title: string;
  person: ReportPerson;
  children?: ReactNode;
}) {
  return (
    <div className="border-line rounded-2xl border p-4">
      <p className="text-muted text-xs font-medium">{title}</p>
      <p className="text-ink mt-1 text-sm font-semibold break-words">
        {person.name}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone="neutral">{roleLabel(person.role)}</Badge>
        <Badge tone={userStatusTone(person.status)}>
          {userStatusLabel(person.status)}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function ResolveForm({
  report,
  action,
  note,
  showErrors,
  confirming,
  busy,
  error,
  onAction,
  onNote,
  onContinue,
  onBack,
  onConfirm,
}: {
  report: ReportDetail;
  action: ResolveReportAction | null;
  note: string;
  showErrors: boolean;
  confirming: boolean;
  busy: boolean;
  error: string | null;
  onAction: (next: ResolveReportAction) => void;
  onNote: (next: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const reported = report.reportedUser;
  const canSuspend = reported.role !== "admin";
  const alreadyInactive = reported.status !== "active";

  if (confirming && action) {
    return (
      <div className="border-line border-t pt-5">
        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border p-4",
            action === "suspend"
              ? "border-danger-200 bg-danger-50"
              : "border-line bg-canvas",
          )}
        >
          <p
            className={cn(
              "text-sm font-semibold",
              action === "suspend" ? "text-danger-700" : "text-ink",
            )}
          >
            {action === "dismiss"
              ? "¿Descartar este reporte?"
              : action === "warn"
                ? `¿Enviar una advertencia a ${reported.name}?`
                : `¿Suspender la cuenta de ${reported.name}?`}
          </p>
          {action === "suspend" ? (
            alreadyInactive ? (
              <p className="text-ink text-sm">
                La cuenta ya no está activa (
                {userStatusLabel(reported.status).toLowerCase()}), así que no
                cambiará. El reporte quedará cerrado como resuelto.
              </p>
            ) : (
              <ul className="text-ink list-disc space-y-1 pl-5 text-sm">
                <li>
                  No podrá iniciar sesión y se cerrarán sus sesiones abiertas.
                </li>
                <li>
                  Se cancelarán todas sus reservas abiertas y se avisará por
                  correo a las otras personas.
                </li>
                <li>El reporte quedará cerrado como resuelto.</li>
                <li>Podrás reactivar la cuenta después desde Personas.</li>
              </ul>
            )
          ) : (
            <p className="text-ink text-sm">
              {actionDescription(action, reported.name)}
            </p>
          )}
          <p className="text-muted text-sm break-words">Nota: {note.trim()}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant={action === "suspend" ? "danger" : "primary"}
              loading={busy}
              onClick={onConfirm}
            >
              {action === "dismiss"
                ? "Sí, descartar"
                : action === "warn"
                  ? "Sí, enviar advertencia"
                  : "Sí, suspender cuenta"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onBack}
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const actionInvalid = showErrors && !action;

  return (
    <div className="border-line flex flex-col gap-4 border-t pt-5">
      <h3 className="text-ink text-sm font-semibold">Resolver reporte</h3>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <fieldset
        aria-describedby={actionInvalid ? "resolve-action-error" : undefined}
        className="flex flex-col gap-2"
      >
        <legend className="text-ink mb-2 text-sm font-medium">Acción</legend>
        {ACTIONS.map((option) => {
          const disabled = option === "suspend" && !canSuspend;

          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition",
                action === option
                  ? option === "suspend"
                    ? "border-danger-500 bg-danger-50"
                    : "border-brand-500 bg-brand-50"
                  : "border-line hover:border-brand-300 bg-white",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="radio"
                name="resolve-action"
                value={option}
                checked={action === option}
                disabled={disabled}
                onChange={() => onAction(option)}
                className="accent-brand-600 mt-1"
              />
              <span>
                <span className="text-ink block text-sm font-semibold">
                  {RESOLVE_ACTION_LABELS[option]}
                </span>
                <span className="text-muted block text-xs leading-5">
                  {disabled
                    ? "Las cuentas de administración no se pueden suspender desde aquí."
                    : actionDescription(option, reported.name)}
                </span>
              </span>
            </label>
          );
        })}
        {actionInvalid ? (
          <p
            id="resolve-action-error"
            role="alert"
            className="text-danger-700 text-xs font-medium"
          >
            Elige una acción.
          </p>
        ) : null}
      </fieldset>

      <ReasonField
        id="resolve-note"
        label="Nota interna"
        value={note}
        onChange={onNote}
        minLength={1}
        maxLength={NOTE_MAX}
        showError={showErrors}
        hint="Solo la ve el equipo."
        placeholder="Qué revisaste y por qué decidiste esta acción."
      />

      <Button type="button" className="sm:w-fit" onClick={onContinue}>
        Continuar
      </Button>
    </div>
  );
}
