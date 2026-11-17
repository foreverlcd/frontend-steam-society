"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api/errors";
import {
  confirmTotpSetup,
  disableMfa,
  getMfaStatus,
  regenerateRecoveryCodes,
  startTotpSetup,
} from "@/lib/api/mfa";
import type { MfaStatus, TotpSetup } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/roles";

type LoadState = "loading" | "ready" | "error";

/** Splits the base32 key in groups of 4 so it can be typed by hand. */
export function formatSecretForManualEntry(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

export function SecurityView() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const enrollmentRequired = useSearchParams().get("required") === "1";
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    setError(null);

    try {
      setStatus(await getMfaStatus());
      setLoadState("ready");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getMfaStatus(controller.signal)
      .then((current) => {
        setStatus(current);
        setLoadState("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(caught));
        setLoadState("error");
      });

    return () => controller.abort();
  }, []);

  const goToAdminPanel = user?.role === "admin" && enrollmentRequired;

  async function handleFinished() {
    // The session must know 2FA is on before the admin guard sees it.
    await Promise.all([load(), refresh()]);
    setRecoveryCodes(null);
    setSetup(null);

    if (goToAdminPanel) {
      router.push(homePathForRole("admin"));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-5 py-8 sm:px-8">
      <header className="space-y-2">
        <h1 className="text-ink text-3xl font-semibold tracking-tight">
          Seguridad de tu cuenta
        </h1>
        <p className="text-muted text-sm leading-6">
          La verificación en dos pasos pide, además de tu contraseña, un código
          de una app en tu teléfono. Así nadie entra aunque conozca tu
          contraseña.
        </p>
      </header>

      {enrollmentRequired && !status?.enabled ? (
        <Alert tone="info">
          Para usar el panel de administración necesitas activar la verificación
          en dos pasos.
        </Alert>
      ) : null}

      {loadState === "loading" ? (
        <div className="text-muted flex items-center gap-3 text-sm">
          <Spinner className="size-4" /> Cargando...
        </div>
      ) : null}

      {loadState === "error" ? (
        <Alert tone="error">
          {error}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => void load()}
          >
            Reintentar
          </button>
        </Alert>
      ) : null}

      {recoveryCodes ? (
        <RecoveryCodesPanel
          codes={recoveryCodes}
          onDone={handleFinished}
          doneLabel={
            goToAdminPanel ? "Ya los guardé, ir al panel" : "Ya los guardé"
          }
        />
      ) : loadState === "ready" && status ? (
        status.enabled ? (
          <EnabledPanel
            status={status}
            onNewCodes={setRecoveryCodes}
            onDisabled={() => void handleFinished()}
          />
        ) : setup ? (
          <ConfirmSetupPanel
            setup={setup}
            onConfirmed={setRecoveryCodes}
            onCancel={() => setSetup(null)}
          />
        ) : (
          <StartSetupPanel onStarted={setSetup} />
        )
      ) : null}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="border-line space-y-4 rounded-2xl border bg-white p-5 sm:p-6">
      {children}
    </section>
  );
}

function StartSetupPanel({
  onStarted,
}: {
  onStarted: (setup: TotpSetup) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    setSubmitting(true);
    setError(null);

    try {
      onStarted(await startTotpSetup());
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-ink text-lg font-semibold">
          Verificación en dos pasos
        </h2>
        <Badge>Desactivada</Badge>
      </div>
      <p className="text-muted text-sm leading-6">
        Necesitas una app de autenticación gratuita en tu teléfono, como Google
        Authenticator, Microsoft Authenticator o Aegis.
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button
        type="button"
        loading={submitting}
        onClick={() => void handleStart()}
      >
        Activar
      </Button>
    </Card>
  );
}

function ConfirmSetupPanel({
  setup,
  onConfirmed,
  onCancel,
}: {
  setup: TotpSetup;
  onConfirmed: (codes: string[]) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.replace(/\s+/g, "");

    if (!/^\d{6}$/.test(trimmed)) {
      setError("Ingresa los 6 dígitos que muestra tu app.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { recoveryCodes } = await confirmTotpSetup(trimmed);
      onConfirmed(recoveryCodes);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-ink text-lg font-semibold">Conecta tu app</h2>
      <ol className="text-muted list-decimal space-y-3 pl-5 text-sm leading-6">
        <li>
          En tu teléfono,{" "}
          <a
            href={setup.otpauthUri}
            className="text-brand-700 font-semibold underline-offset-4 hover:underline"
          >
            abre este enlace en tu app de autenticación
          </a>
          . Si estás en la computadora, agrega una cuenta nueva en la app con
          “Ingresar una clave” y escribe esta clave:
          <code className="bg-canvas text-ink mt-2 block rounded-lg px-3 py-2 font-mono text-base tracking-wider break-all select-all">
            {formatSecretForManualEntry(setup.secret)}
          </code>
        </li>
        <li>Escribe el código de 6 dígitos que aparece en la app.</li>
      </ol>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="totp-confirm-code"
          label="Código de la app"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={submitting}>
            Confirmar y activar
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RecoveryCodesPanel({
  codes,
  onDone,
  doneLabel,
}: {
  codes: string[];
  onDone: () => Promise<void> | void;
  doneLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [finishing, setFinishing] = useState(false);

  async function handleDone() {
    setFinishing(true);

    try {
      await onDone();
    } finally {
      setFinishing(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card>
      <h2 className="text-ink text-lg font-semibold">
        Guarda tus códigos de recuperación
      </h2>
      <Alert tone="info">
        Si pierdes tu teléfono, cada código te deja entrar una sola vez.
        Guárdalos en un lugar seguro: no los volveremos a mostrar.
      </Alert>
      <ul className="bg-canvas grid grid-cols-2 gap-2 rounded-xl p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="text-ink select-all">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleCopy()}
        >
          {copied ? "Copiados" : "Copiar códigos"}
        </Button>
        <Button
          type="button"
          loading={finishing}
          onClick={() => void handleDone()}
        >
          {doneLabel}
        </Button>
      </div>
    </Card>
  );
}

function EnabledPanel({
  status,
  onNewCodes,
  onDisabled,
}: {
  status: MfaStatus;
  onNewCodes: (codes: string[]) => void;
  onDisabled: () => void;
}) {
  const [action, setAction] = useState<"none" | "codes" | "disable">("none");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function choose(next: "none" | "codes" | "disable") {
    setAction(next);
    setCode("");
    setPassword("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.replace(/\s+/g, "");

    if (!/^\d{6}$/.test(trimmed)) {
      setError("Ingresa los 6 dígitos que muestra tu app.");
      return;
    }

    if (action === "disable" && !password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (action === "codes") {
        const { recoveryCodes } = await regenerateRecoveryCodes(trimmed);
        onNewCodes(recoveryCodes);
      } else {
        await disableMfa({ password, code: trimmed });
        onDisabled();
      }
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-ink text-lg font-semibold">
          Verificación en dos pasos
        </h2>
        <Badge tone="success">Activa</Badge>
      </div>
      <p className="text-muted text-sm leading-6">
        Te quedan {status.recoveryCodesRemaining} códigos de recuperación.
        {status.recoveryCodesRemaining <= 3
          ? " Genera códigos nuevos pronto."
          : ""}
        {status.required ? " Tu rol debe mantenerla activa." : ""}
      </p>

      {action === "none" ? (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => choose("codes")}
          >
            Generar códigos nuevos
          </Button>
          {!status.required ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => choose("disable")}
            >
              Desactivar
            </Button>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-muted text-sm">
            {action === "codes"
              ? "Los códigos anteriores dejarán de funcionar."
              : "Tu cuenta quedará protegida solo con la contraseña."}
          </p>
          {action === "disable" ? (
            <TextField
              id="mfa-disable-password"
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          ) : null}
          <TextField
            id="mfa-action-code"
            label="Código de la app"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant={action === "disable" ? "danger" : "primary"}
              loading={submitting}
            >
              {action === "codes" ? "Generar códigos" : "Desactivar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => choose("none")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
