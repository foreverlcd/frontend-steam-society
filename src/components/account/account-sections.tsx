"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/account/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import {
  changePassword,
  deleteAccount,
  exportMyData,
  listSessions,
  requestEmailChange,
  revokeOtherSessions,
  revokeSession,
} from "@/lib/api/account";
import { isApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import type { ActiveSession, StepUpProof } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const MIN_PASSWORD_LENGTH = 12;
/** Word the person types to confirm the deletion (the API checks it too). */
export const DELETE_CONFIRMATION_WORD = "ELIMINAR";

const dateTimeFormat = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** "Chrome en Windows": enough to recognise a device, never trusted. */
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Navegador desconocido";

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Navegador";
  const system = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iPhone o iPad"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X/.test(userAgent)
          ? "Mac"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;

  return system ? `${browser} en ${system}` : browser;
}

export function exportFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `steam-society-mis-datos-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Number of future bookings that block the deletion, from the 409 details. */
function openBookingsCount(error: unknown): number | null {
  if (!isApiError(error) || error.code !== "ACCOUNT_HAS_OPEN_BOOKINGS") {
    return null;
  }
  const details = error.details as { openBookings?: unknown } | undefined;
  return typeof details?.openBookings === "number"
    ? details.openBookings
    : null;
}

/** Sessions, password, e-mail and personal data, below the 2FA section. */
export function AccountSections() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 pb-10 sm:px-8">
      <SessionsCard />
      <PasswordCard mfaEnabled={user.mfaEnabled} />
      <EmailCard currentEmail={user.email} mfaEnabled={user.mfaEnabled} />
      <DataCard
        mfaEnabled={user.mfaEnabled}
        canDelete={user.role !== "admin"}
      />
    </div>
  );
}

/** Password again, plus the app code when the account has 2FA. */
function StepUpFields({
  idPrefix,
  mfaEnabled,
  password,
  code,
  onPasswordChange,
  onCodeChange,
}: {
  idPrefix: string;
  mfaEnabled: boolean;
  password: string;
  code: string;
  onPasswordChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}) {
  return (
    <>
      <TextField
        id={`${idPrefix}-password`}
        label="Tu contraseña actual"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        required
      />
      {mfaEnabled ? (
        <TextField
          id={`${idPrefix}-code`}
          label="Código de tu app de autenticación"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          required
        />
      ) : null}
    </>
  );
}

/** Checks the step-up inputs; returns an error message or the proof. */
function buildProof(
  password: string,
  code: string,
  mfaEnabled: boolean,
): { error: string } | { proof: StepUpProof } {
  if (!password) return { error: "Ingresa tu contraseña actual." };
  if (!mfaEnabled) return { proof: { password } };

  const trimmed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(trimmed)) {
    return { error: "Ingresa los 6 dígitos que muestra tu app." };
  }
  return { proof: { password, code: trimmed } };
}

function SessionsCard() {
  const [sessions, setSessions] = useState<ActiveSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSessions(await listSessions());
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    listSessions(controller.signal)
      .then(setSessions)
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(caught));
      });

    return () => controller.abort();
  }, []);

  async function handleRevoke(id: string) {
    setBusyId(id);
    setNotice(null);
    try {
      await revokeSession(id);
      setNotice("Cerramos esa sesión.");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeOthers() {
    setBusyId("others");
    setNotice(null);
    try {
      const { revoked } = await revokeOtherSessions();
      setNotice(
        revoked === 1 ? "Cerramos 1 sesión." : `Cerramos ${revoked} sesiones.`,
      );
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  const others = sessions?.filter((session) => !session.current) ?? [];

  return (
    <Card>
      <h2 className="text-ink text-lg font-semibold">Sesiones activas</h2>
      <p className="text-muted text-sm leading-6">
        Los navegadores y dispositivos donde tu cuenta está abierta. Si no
        reconoces alguno, ciérralo y cambia tu contraseña.
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {sessions === null && !error ? (
        <div className="text-muted flex items-center gap-3 text-sm">
          <Spinner className="size-4" /> Cargando...
        </div>
      ) : null}
      {sessions ? (
        <ul className="divide-line divide-y">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="space-y-1">
                <p className="text-ink text-sm font-semibold">
                  {describeUserAgent(session.userAgent)}{" "}
                  {session.current ? (
                    <Badge tone="success">Esta sesión</Badge>
                  ) : null}
                </p>
                <p className="text-muted text-xs">
                  Último uso:{" "}
                  {dateTimeFormat.format(new Date(session.lastActiveAt))}
                  {session.signedInAt
                    ? ` · Inició: ${dateTimeFormat.format(new Date(session.signedInAt))}`
                    : ""}
                </p>
              </div>
              {!session.current ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={busyId === session.id}
                  disabled={busyId !== null}
                  onClick={() => void handleRevoke(session.id)}
                >
                  Cerrar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {others.length > 0 ? (
        <Button
          type="button"
          variant="secondary"
          loading={busyId === "others"}
          disabled={busyId !== null}
          onClick={() => void handleRevokeOthers()}
        >
          Cerrar todas las demás
        </Button>
      ) : null}
    </Card>
  );
}

function PasswordCard({ mfaEnabled }: { mfaEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    setPassword("");
    setCode("");
    setNewPassword("");
    setRepeat("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = buildProof(password, code, mfaEnabled);
    if ("error" in checked) return setError(checked.error);
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return setError(
        `La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }
    if (newPassword !== repeat) {
      return setError("Las contraseñas nuevas no coinciden.");
    }

    setSubmitting(true);
    setError(null);
    try {
      await changePassword({ ...checked.proof, newPassword });
      reset(false);
      setDone(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-ink text-lg font-semibold">Contraseña</h2>
      {done ? (
        <Alert tone="success">
          Cambiamos tu contraseña y cerramos tus otras sesiones. Te enviamos un
          correo de aviso.
        </Alert>
      ) : null}
      {!open ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setDone(false);
            reset(true);
          }}
        >
          Cambiar contraseña
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <StepUpFields
            idPrefix="password-change"
            mfaEnabled={mfaEnabled}
            password={password}
            code={code}
            onPasswordChange={setPassword}
            onCodeChange={setCode}
          />
          <TextField
            id="password-change-new"
            label="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <TextField
            id="password-change-repeat"
            label="Repite la contraseña nueva"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
            required
          />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={submitting}>
              Guardar contraseña
            </Button>
            <Button type="button" variant="ghost" onClick={() => reset(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function EmailCard({
  currentEmail,
  mfaEnabled,
}: {
  currentEmail: string;
  mfaEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    setPassword("");
    setCode("");
    setNewEmail("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = buildProof(password, code, mfaEnabled);
    if ("error" in checked) return setError(checked.error);
    const email = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Ingresa un correo válido.");
    }

    setSubmitting(true);
    setError(null);
    try {
      await requestEmailChange({ ...checked.proof, newEmail: email });
      reset(false);
      setSentTo(email);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-ink text-lg font-semibold">Correo</h2>
      <p className="text-muted text-sm leading-6">
        Tu correo actual es{" "}
        <span className="text-ink font-semibold">{currentEmail}</span>.
      </p>
      {sentTo ? (
        <Alert tone="success">
          Te enviamos un enlace a {sentTo}. El cambio se hace cuando lo abras;
          hasta entonces sigues entrando con tu correo actual.
        </Alert>
      ) : null}
      {!open ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSentTo(null);
            reset(true);
          }}
        >
          Cambiar correo
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextField
            id="email-change-new"
            label="Correo nuevo"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            required
          />
          <StepUpFields
            idPrefix="email-change"
            mfaEnabled={mfaEnabled}
            password={password}
            code={code}
            onPasswordChange={setPassword}
            onCodeChange={setCode}
          />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={submitting}>
              Enviar enlace
            </Button>
            <Button type="button" variant="ghost" onClick={() => reset(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function DataCard({
  mfaEnabled,
  canDelete,
}: {
  mfaEnabled: boolean;
  canDelete: boolean;
}) {
  const { refresh } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName(new Date());
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setExportError(getErrorMessage(caught));
    } finally {
      setExporting(false);
    }
  }

  function toggleDelete(next: boolean) {
    setDeleting(next);
    setPassword("");
    setCode("");
    setConfirmation("");
    setError(null);
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation.trim() !== DELETE_CONFIRMATION_WORD) {
      return setError(`Escribe ${DELETE_CONFIRMATION_WORD} para confirmar.`);
    }
    const checked = buildProof(password, code, mfaEnabled);
    if ("error" in checked) return setError(checked.error);

    setSubmitting(true);
    setError(null);
    try {
      await deleteAccount({
        ...checked.proof,
        confirmation: DELETE_CONFIRMATION_WORD,
      });
    } catch (caught) {
      const open = openBookingsCount(caught);
      setError(
        open !== null
          ? `Tienes ${open === 1 ? "1 reserva pendiente" : `${open} reservas pendientes`}. Cancélalas o espera a que terminen antes de eliminar tu cuenta.`
          : getErrorMessage(caught),
      );
      setSubmitting(false);
      return;
    }

    // The account is gone: drop the secrets now, not after the refresh.
    setPassword("");
    setCode("");
    setConfirmation("");
    // The API already closed every session; forget the user here too. A
    // failed refresh must not keep the person on this page.
    await refresh().catch(() => undefined);
    router.push("/login");
  }

  return (
    <Card>
      <h2 className="text-ink text-lg font-semibold">Tus datos</h2>
      <p className="text-muted text-sm leading-6">
        Descarga una copia de todo lo que guardamos sobre ti (cuenta, perfil,
        disponibilidad y reservas) en un archivo JSON.
      </p>
      {exportError ? <Alert tone="error">{exportError}</Alert> : null}
      <Button
        type="button"
        variant="secondary"
        loading={exporting}
        onClick={() => void handleExport()}
      >
        Descargar mis datos
      </Button>

      <div className="border-line space-y-4 border-t pt-4">
        <h3 className="text-ink font-semibold">Eliminar mi cuenta</h3>
        {!canDelete ? (
          <p className="text-muted text-sm leading-6">
            Las cuentas de administración no se pueden eliminar desde aquí.
            Pídeselo a otra persona del equipo.
          </p>
        ) : !deleting ? (
          <>
            <p className="text-muted text-sm leading-6">
              Borramos tu perfil, tu disponibilidad y tus datos personales, y
              cerramos todas tus sesiones. Las reservas pasadas se conservan sin
              tu nombre ni tu correo. No se puede deshacer.
            </p>
            <Button
              type="button"
              variant="danger"
              onClick={() => toggleDelete(true)}
            >
              Eliminar mi cuenta
            </Button>
          </>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4" noValidate>
            <Alert tone="error">
              Esto no se puede deshacer. Si tienes reservas pendientes,
              cancélalas antes.
            </Alert>
            <StepUpFields
              idPrefix="account-delete"
              mfaEnabled={mfaEnabled}
              password={password}
              code={code}
              onPasswordChange={setPassword}
              onCodeChange={setCode}
            />
            <TextField
              id="account-delete-confirmation"
              label={`Escribe ${DELETE_CONFIRMATION_WORD} para confirmar`}
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="danger" loading={submitting}>
                Eliminar definitivamente
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
