"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { getAdminOverview, type AdminOverview } from "@/lib/api/admin";
import { BOOKING_STATUSES } from "@/lib/api/bookings";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import type { UserRole } from "@/lib/api/types";
import { BOOKING_STATUS_LABELS, sumCounts } from "@/lib/admin/labels";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDateTime } from "@/lib/catalog/format";
import { cn } from "@/lib/cn";
import {
  AdminPage,
  AdminPageHeader,
  ErrorBlock,
  LoadingBlock,
  PANEL_CLASS,
  StatTile,
} from "./admin-shared";

const ROLE_ROWS: Array<{ role: UserRole; label: string }> = [
  { role: "mentee", label: "Mentoradas" },
  { role: "mentor", label: "Mentoras" },
  { role: "admin", label: "Administración" },
];

export function AdminOverviewView() {
  const { refresh } = useAuth();
  const [state, setState] = useState<{
    token: number;
    data: AdminOverview | null;
    error: string | null;
  } | null>(null);
  const [token, setToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminOverview(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ token, data, error: null });
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        setState({ token, data: null, error: getErrorMessage(caught) });
      });

    return () => controller.abort();
  }, [refresh, token]);

  const current = state?.token === token ? state : null;
  const data = current?.data ?? null;

  return (
    <AdminPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <AdminPageHeader
          title="Resumen"
          description="Lo que necesita atención hoy y cómo va el piloto. Los números se calculan al cargar la página."
        />
        <button
          type="button"
          onClick={() => setToken((value) => value + 1)}
          className={buttonClassName({ variant: "secondary", size: "sm" })}
        >
          Actualizar
        </button>
      </div>

      {!current ? (
        <LoadingBlock message="Cargando resumen..." />
      ) : current.error || !data ? (
        <ErrorBlock
          message={current.error ?? "No pudimos cargar el resumen."}
          onRetry={() => setToken((value) => value + 1)}
        />
      ) : (
        <OverviewContent data={data} />
      )}
    </AdminPage>
  );
}

function OverviewContent({ data }: { data: AdminOverview }) {
  const bookingsTotal = sumCounts(data.bookingsLast30Days);
  const peopleTotal = ROLE_ROWS.reduce(
    (total, row) => total + sumCounts(data.users[row.role]),
    0,
  );
  const suspendedTotal = ROLE_ROWS.reduce(
    (total, row) => total + (data.users[row.role]?.suspended ?? 0),
    0,
  );

  return (
    <div className="mt-8 flex flex-col gap-5">
      <section
        aria-labelledby="attention-title"
        className="grid gap-4 sm:grid-cols-2"
      >
        <h2 id="attention-title" className="sr-only">
          Requiere atención
        </h2>
        <QueueCard
          href="/admin/reports"
          title="Reportes abiertos"
          count={data.openReports}
          emptyText="No hay reportes por revisar."
          pendingText="Revisa primero los más antiguos."
          linkLabel="Ir a reportes"
          tone="danger"
        />
        <QueueCard
          href="/admin/mentors"
          title="Mentoras por revisar"
          count={data.mentors.pendingReview}
          emptyText="No hay perfiles esperando revisión."
          pendingText="Perfiles enviados que esperan aprobación."
          linkLabel="Ir a mentoras"
          tone="attention"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="people-title" className={PANEL_CLASS}>
          <div className="flex items-start justify-between gap-3">
            <h2 id="people-title" className="text-ink text-base font-semibold">
              Personas
            </h2>
            <Link
              href="/admin/people"
              className="text-brand-700 text-sm font-semibold hover:underline"
            >
              Ver personas
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile label="Cuentas en total" value={peopleTotal} />
            <StatTile
              label="Nuevas en 30 días"
              value={data.newUsersLast30Days}
            />
            <StatTile
              label="Mentoras aprobadas"
              value={data.mentors.approved}
            />
            <StatTile label="Suspendidas" value={suspendedTotal} />
          </div>
          <table className="mt-5 w-full text-sm">
            <caption className="sr-only">Cuentas por rol y estado</caption>
            <thead>
              <tr className="text-muted text-left text-xs">
                <th scope="col" className="pb-2 font-medium">
                  Rol
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Activas
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Sin verificar
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Suspendidas
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {ROLE_ROWS.map((row) => {
                const counts = data.users[row.role] ?? {};

                return (
                  <tr key={row.role}>
                    <th
                      scope="row"
                      className="text-ink py-2 text-left font-medium"
                    >
                      {row.label}
                    </th>
                    <td className="text-ink py-2 text-right tabular-nums">
                      {counts.active ?? 0}
                    </td>
                    <td className="text-ink py-2 text-right tabular-nums">
                      {counts.pending_verification ?? 0}
                    </td>
                    <td className="text-ink py-2 text-right tabular-nums">
                      {counts.suspended ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="bookings-title" className={PANEL_CLASS}>
          <div className="flex items-start justify-between gap-3">
            <h2
              id="bookings-title"
              className="text-ink text-base font-semibold"
            >
              Reservas
            </h2>
            <Link
              href="/admin/bookings"
              className="text-brand-700 text-sm font-semibold hover:underline"
            >
              Ver reservas
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile label="Solicitadas en 30 días" value={bookingsTotal} />
            <StatTile
              label="Confirmadas próximos 7 días"
              value={data.upcomingConfirmedNext7Days}
            />
          </div>
          <dl className="divide-line mt-5 divide-y text-sm">
            {BOOKING_STATUSES.map((status) => (
              <div key={status} className="flex justify-between gap-3 py-2">
                <dt className="text-muted">{BOOKING_STATUS_LABELS[status]}</dt>
                <dd className="text-ink tabular-nums">
                  {data.bookingsLast30Days[status] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section aria-labelledby="email-title" className={PANEL_CLASS}>
        <h2 id="email-title" className="text-ink text-base font-semibold">
          Correos
        </h2>
        <p className="text-muted mt-1 text-sm">
          Avisos de reservas, verificación y moderación.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <StatTile
            label="Fallidos en 7 días"
            value={data.email.failedLast7Days}
            tone={data.email.failedLast7Days > 0 ? "danger" : "neutral"}
          />
          <StatTile label="En cola" value={data.email.pending} />
        </div>
      </section>

      <p className="text-muted text-xs">
        Actualizado: {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
}

function QueueCard({
  href,
  title,
  count,
  emptyText,
  pendingText,
  linkLabel,
  tone,
}: {
  href: string;
  title: string;
  count: number;
  emptyText: string;
  pendingText: string;
  linkLabel: string;
  tone: "danger" | "attention";
}) {
  const pending = count > 0;

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 rounded-3xl border p-5 shadow-sm sm:p-6",
        !pending
          ? "border-line bg-white"
          : tone === "danger"
            ? "border-danger-200 bg-danger-50"
            : "border-brand-300 bg-brand-50",
      )}
    >
      <div>
        <p className="text-ink text-sm font-semibold">{title}</p>
        <p
          className={cn(
            "mt-2 text-4xl font-semibold tabular-nums",
            pending && tone === "danger" ? "text-danger-700" : "text-ink",
          )}
        >
          {count}
        </p>
        <p className="text-muted mt-2 text-sm">
          {pending ? pendingText : emptyText}
        </p>
      </div>
      <Link
        href={href}
        className={buttonClassName({
          variant: pending
            ? tone === "danger"
              ? "danger"
              : "primary"
            : "secondary",
          className: "w-full sm:w-fit",
        })}
      >
        {linkLabel}
      </Link>
    </div>
  );
}
