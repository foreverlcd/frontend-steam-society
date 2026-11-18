"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errors";
import {
  blockUser,
  createReport,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/api/safety";

interface ReportDialogProps {
  /** Who is being reported or blocked. */
  person: { id: string; name: string };
  bookingId?: string;
  onClose: () => void;
  /** Called after a block, e.g. to reload the bookings it cancelled. */
  onBlocked?: (cancelledBookings: number) => void;
}

/**
 * Report and/or block someone. Both are private: the other person is never
 * told who reported them, and a block only shows up as a cancellation.
 */
export function ReportDialog({
  person,
  bookingId,
  onClose,
  onBlocked,
}: ReportDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  async function submit(mode: "report" | "block") {
    if (mode === "report" && !reason) {
      setError("Elige un motivo.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "report" && reason) {
        await createReport({
          reportedUserId: person.id,
          bookingId,
          reason,
          details: details.trim() || undefined,
        });
      }
      let cancelled = 0;
      if (mode === "block" || alsoBlock) {
        const result = await blockUser(person.id);
        cancelled = result.cancelledBookings;
        onBlocked?.(cancelled);
      }
      setDone(
        [
          mode === "report"
            ? "Gracias. El equipo de Steam Society revisará tu reporte."
            : null,
          mode === "block" || alsoBlock
            ? `Bloqueaste a ${person.name}. Ya no pueden reservar entre ustedes${cancelled > 0 ? ` y cancelamos ${cancelled === 1 ? "la reserva abierta" : `${cancelled} reservas abiertas`}` : ""}.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="bg-surface text-ink m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="space-y-4 p-5">
        <div>
          <h2 id={titleId} className="text-lg font-semibold">
            Reportar o bloquear a {person.name}
          </h2>
          <p className="text-muted mt-1 text-sm">
            Es privado: {person.name} no sabrá que lo hiciste.
          </p>
        </div>

        {done ? (
          <>
            <Alert tone="success">{done}</Alert>
            <p className="text-muted text-sm">
              Si estás en peligro, llama al 105 (Policía). Ante violencia contra
              la mujer o familiar, llama gratis a la Línea 100.{" "}
              <Link href="/help" className="text-brand-700 underline">
                Más ayuda
              </Link>
            </p>
            <Button type="button" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">¿Qué pasó?</legend>
              {REPORT_REASONS.map((value) => (
                <label
                  key={value}
                  className="border-line has-checked:border-brand-500 has-checked:bg-brand-50 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                  />
                  {REPORT_REASON_LABELS[value]}
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <label
                htmlFor={`${titleId}-details`}
                className="text-sm font-medium"
              >
                Cuéntanos más (opcional)
              </label>
              <textarea
                id={`${titleId}-details`}
                value={details}
                maxLength={2000}
                rows={3}
                onChange={(event) => setDetails(event.target.value)}
                className="border-line focus-visible:ring-brand-500 w-full rounded-xl border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                placeholder="Qué ocurrió y cuándo. Solo lo lee el equipo."
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={alsoBlock}
                onChange={(event) => setAlsoBlock(event.target.checked)}
              />
              <span>
                Bloquear también a {person.name}: se cancelan sus reservas
                abiertas contigo y no podrán volver a reservar entre ustedes.
              </span>
            </label>

            {error ? <Alert tone="error">{error}</Alert> : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                loading={busy}
                onClick={() => void submit("report")}
              >
                Enviar reporte
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void submit("block")}
              >
                Solo bloquear
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={onClose}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
