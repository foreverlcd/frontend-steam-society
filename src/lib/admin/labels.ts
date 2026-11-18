import type {
  ReportAction,
  ReportReason,
  ReportStatus,
  ResolveReportAction,
} from "@/lib/api/admin-reports";
import type { BookingStatus } from "@/lib/api/bookings";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Solicitada",
  awaiting_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  declined: "Rechazada",
  cancelled: "Cancelada",
  expired: "Vencida",
  completed: "Completada",
  no_show: "No asistió",
};

/** Bookings an admin can still cancel (the API is the final authority). */
export const ADMIN_CANCELLABLE_STATUSES: readonly BookingStatus[] = [
  "requested",
  "awaiting_payment",
  "confirmed",
];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: "Acoso",
  inappropriate_content: "Contenido inapropiado",
  spam_or_fraud: "Spam o fraude",
  safety_concern: "Riesgo para la seguridad",
  no_show: "No se presentó",
  other: "Otro",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Abierto",
  resolved: "Resuelto",
  dismissed: "Descartado",
};

export const REPORT_ACTION_LABELS: Record<ReportAction, string> = {
  none: "Sin acción",
  warned: "Advertencia enviada",
  suspended: "Cuenta suspendida",
};

export const RESOLVE_ACTION_LABELS: Record<ResolveReportAction, string> = {
  dismiss: "Descartar",
  warn: "Advertir",
  suspend: "Suspender cuenta",
};

const HISTORY_ACTION_LABELS: Record<string, string> = {
  "user.suspended": "Cuenta suspendida",
  "user.reactivated": "Cuenta reactivada",
  "user.deleted": "Cuenta eliminada",
  "user.email_changed": "Cambió su correo",
  "user.password_changed": "Cambió su contraseña",
  "user.mfa_enabled": "Activó la verificación en dos pasos",
  "user.mfa_disabled": "Desactivó la verificación en dos pasos",
  "booking.cancelled_by_admin": "Reserva cancelada por administración",
  "report.resolved": "Reporte cerrado",
};

export function historyActionLabel(action: string): string {
  return HISTORY_ACTION_LABELS[action] ?? action;
}

/** Reads `metadata.reason` from an audit entry when it is a string. */
export function historyReason(metadata: unknown): string | null {
  if (typeof metadata !== "object" || metadata === null) {
    return null;
  }

  const reason = (metadata as Record<string, unknown>).reason;

  return typeof reason === "string" && reason.trim() ? reason : null;
}

export function sumCounts(
  counts: Partial<Record<string, number>> | undefined,
): number {
  if (!counts) {
    return 0;
  }

  return Object.values(counts).reduce<number>(
    (total, value) => total + (value ?? 0),
    0,
  );
}

/**
 * Turns `YYYY-MM-DD` values from date inputs (local time of the browser) into
 * the ISO range the API expects: `from` inclusive at 00:00, `to` exclusive at
 * 00:00 of the following day so the end date is included.
 */
export function dateRangeToIso(
  fromDay: string,
  toDay: string,
): { from?: string; to?: string } {
  const range: { from?: string; to?: string } = {};
  const from = parseLocalDay(fromDay);
  const to = parseLocalDay(toDay);

  if (from) {
    range.from = from.toISOString();
  }

  if (to) {
    to.setDate(to.getDate() + 1);
    range.to = to.toISOString();
  }

  return range;
}

function parseLocalDay(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);

  if (!match) {
    return null;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return Number.isNaN(date.getTime()) ? null : date;
}
