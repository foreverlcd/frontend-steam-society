"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import {
  getAvailability,
  replaceAvailability,
  type AvailabilityRuleInput,
  type Weekday,
} from "@/lib/api/scheduling";
import { useAuth } from "@/lib/auth/auth-context";

type Status = "loading" | "ready" | "error";

interface DraftRule extends AvailabilityRuleInput {
  key: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  timezone: string;
}

const WEEKDAYS: Array<{ value: Weekday; label: string }> = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function newRule(timezone: string): DraftRule {
  return {
    key: crypto.randomUUID(),
    weekday: 1,
    startTime: "09:00",
    endTime: "12:00",
    timezone,
  };
}

export function AvailabilityView() {
  const { refresh } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("America/Lima");
  const [rules, setRules] = useState<DraftRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getAvailability(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setTimezone(response.timezone);
        setRules(
          response.rules.map((rule) => ({
            key: rule.id,
            weekday: rule.weekday,
            startTime: rule.startTime,
            endTime: rule.endTime,
            timezone: rule.timezone,
            validFrom: rule.validFrom,
            validTo: rule.validTo,
          })),
        );
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
  }, [refresh]);

  function updateRule(key: string, patch: Partial<DraftRule>) {
    setRules((current) =>
      current.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule)),
    );
    setNotice(null);
    setFormError(null);
  }

  function removeRule(key: string) {
    setRules((current) => current.filter((rule) => rule.key !== key));
    setNotice(null);
  }

  function addRule() {
    setRules((current) => [...current, newRule(timezone)]);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setNotice(null);

    try {
      const response = await replaceAvailability({
        rules: rules.map((rule) => ({
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime,
          timezone: rule.timezone || timezone,
          validFrom: rule.validFrom ?? null,
          validTo: rule.validTo ?? null,
        })),
      });

      setTimezone(response.timezone);
      setRules(
        response.rules.map((rule) => ({
          key: rule.id,
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime,
          timezone: rule.timezone,
          validFrom: rule.validFrom,
          validTo: rule.validTo,
        })),
      );
      setNotice("Disponibilidad guardada.");
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setFormError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Mentora
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Mi disponibilidad
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Define tus franjas semanales. Los horarios se generan con tu zona
          horaria y la duración de cada oferta.
        </p>
      </header>

      {status === "loading" ? (
        <div className="text-muted mt-8 flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Cargando disponibilidad…</span>
        </div>
      ) : null}

      {status === "error" ? (
        <Alert tone="error" className="mt-8">
          {error ?? "No pudimos cargar tu disponibilidad."}
        </Alert>
      ) : null}

      {status === "ready" ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="border-line rounded-3xl border bg-white p-6 shadow-sm">
            <div className="max-w-xs space-y-1.5">
              <label
                htmlFor="availability-timezone"
                className="text-ink block text-sm font-medium"
              >
                Zona horaria
              </label>
              <Input
                id="availability-timezone"
                required
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="America/Lima"
              />
              <p className="text-muted text-xs">
                Formato IANA, por ejemplo America/Lima.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rules.length === 0 ? (
              <p className="border-line text-muted rounded-2xl border border-dashed px-5 py-8 text-sm">
                No tienes franjas configuradas. Agrega la primera para que las
                mentoradas puedan reservar.
              </p>
            ) : null}

            {rules.map((rule, index) => (
              <div
                key={rule.key}
                className="border-line grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor={`weekday-${rule.key}`}
                    className="text-ink block text-xs font-medium"
                  >
                    Día
                  </label>
                  <select
                    id={`weekday-${rule.key}`}
                    value={rule.weekday}
                    onChange={(event) =>
                      updateRule(rule.key, {
                        weekday: Number(event.target.value) as Weekday,
                      })
                    }
                    className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
                  >
                    {WEEKDAYS.map((weekday) => (
                      <option key={weekday.value} value={weekday.value}>
                        {weekday.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`start-${rule.key}`}
                    className="text-ink block text-xs font-medium"
                  >
                    Desde
                  </label>
                  <Input
                    id={`start-${rule.key}`}
                    type="time"
                    required
                    value={rule.startTime}
                    onChange={(event) =>
                      updateRule(rule.key, { startTime: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`end-${rule.key}`}
                    className="text-ink block text-xs font-medium"
                  >
                    Hasta
                  </label>
                  <Input
                    id={`end-${rule.key}`}
                    type="time"
                    required
                    value={rule.endTime}
                    onChange={(event) =>
                      updateRule(rule.key, { endTime: event.target.value })
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Eliminar franja ${index + 1}`}
                  onClick={() => removeRule(rule.key)}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={addRule}>
              Agregar franja
            </Button>
            <Button type="submit" loading={saving}>
              Guardar disponibilidad
            </Button>
          </div>

          {notice ? <Alert tone="success">{notice}</Alert> : null}
          {formError ? <Alert tone="error">{formError}</Alert> : null}
        </form>
      ) : null}
    </div>
  );
}
