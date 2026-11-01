"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import {
  archiveOffering,
  createOffering,
  listOfferings,
  updateOffering,
  type Offering,
} from "@/lib/api/scheduling";
import { useAuth } from "@/lib/auth/auth-context";
import { formatPrice } from "@/lib/catalog/format";

type Status = "loading" | "ready" | "error";

interface OfferingForm {
  title: string;
  description: string;
  durationMinutes: string;
  isFree: boolean;
  price: string;
  currency: string;
}

const EMPTY_FORM: OfferingForm = {
  title: "",
  description: "",
  durationMinutes: "60",
  isFree: true,
  price: "",
  currency: "PEN",
};

export function OfferingsView() {
  const { refresh } = useAuth();
  const [items, setItems] = useState<Offering[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OfferingForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Offering | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void listOfferings(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setItems(response.items);
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

  async function reload() {
    setStatus("loading");
    setError(null);

    try {
      const response = await listOfferings();
      setItems(response.items);
      setStatus("ready");
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
        return;
      }

      setError(getErrorMessage(caught));
      setStatus("error");
    }
  }

  function startEdit(offering: Offering) {
    setEditing(offering);
    setForm({
      title: offering.title,
      description: offering.description ?? "",
      durationMinutes: String(offering.durationMinutes),
      isFree: offering.isFree,
      price: offering.isFree ? "" : (offering.priceMinor / 100).toFixed(2),
      currency: offering.currency,
    });
    setFormError(null);
    setNotice(null);
  }

  function resetForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setNotice(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      durationMinutes: Number(form.durationMinutes),
      isFree: form.isFree,
      ...(form.isFree
        ? { priceMinor: 0 }
        : {
            priceMinor: Math.round(Number(form.price) * 100),
            currency: form.currency.toUpperCase(),
          }),
    };

    try {
      if (editing) {
        await updateOffering(editing.id, payload);
        setNotice("Oferta actualizada.");
      } else {
        await createOffering(payload);
        setNotice("Oferta creada.");
      }

      resetForm();
      await reload();
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setFormError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(offering: Offering) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`¿Archivar la oferta "${offering.title}"?`)
    ) {
      return;
    }

    setBusyId(offering.id);
    setError(null);

    try {
      await archiveOffering(offering.id);
      setNotice("Oferta archivada.");
      await reload();
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Mentora
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Mis ofertas
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Define las sesiones que ofreces. Las ofertas activas aparecen en tu
          perfil público del catálogo.
        </p>
      </header>

      {notice ? (
        <Alert tone="success" className="mt-6">
          {notice}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" className="mt-6">
          {error}
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="border-line h-fit rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-ink text-lg font-semibold">
            {editing ? "Editar oferta" : "Nueva oferta"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="offering-title"
                className="text-ink block text-sm font-medium"
              >
                Título
              </label>
              <Input
                id="offering-title"
                required
                maxLength={160}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Mentoría 1:1 en ingeniería de software"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="offering-description"
                className="text-ink block text-sm font-medium"
              >
                Descripción
              </label>
              <textarea
                id="offering-description"
                rows={3}
                maxLength={2000}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="offering-duration"
                  className="text-ink block text-sm font-medium"
                >
                  Duración (min)
                </label>
                <Input
                  id="offering-duration"
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  required
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: event.target.value,
                    }))
                  }
                />
              </div>

              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isFree: event.target.checked,
                    }))
                  }
                  className="text-brand-600 focus:ring-brand-500 size-4 rounded border"
                />
                <span className="text-ink font-medium">Gratuita</span>
              </label>
            </div>

            {!form.isFree ? (
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="offering-price"
                    className="text-ink block text-sm font-medium"
                  >
                    Precio
                  </label>
                  <Input
                    id="offering-price"
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="offering-currency"
                    className="text-ink block text-sm font-medium"
                  >
                    Moneda
                  </label>
                  <Input
                    id="offering-currency"
                    required
                    maxLength={3}
                    value={form.currency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currency: event.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}

            {formError ? <Alert tone="error">{formError}</Alert> : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={saving}>
                {editing ? "Guardar cambios" : "Crear oferta"}
              </Button>
              {editing ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-ink text-lg font-semibold">Tus ofertas</h2>

          {status === "loading" ? (
            <div className="text-muted mt-4 flex items-center gap-3 text-sm">
              <Spinner className="size-4" />
              <span>Cargando ofertas…</span>
            </div>
          ) : null}

          {status === "error" ? (
            <Alert tone="error" className="mt-4">
              {error ?? "No pudimos cargar tus ofertas."}
            </Alert>
          ) : null}

          {status === "ready" && items.length === 0 ? (
            <p className="border-line text-muted mt-4 rounded-2xl border border-dashed px-5 py-8 text-sm">
              Aún no tienes ofertas. Crea la primera para aparecer en el
              catálogo.
            </p>
          ) : null}

          <ul className="mt-4 space-y-3">
            {items.map((offering) => (
              <li
                key={offering.id}
                className="border-line rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-ink text-base font-semibold">
                      {offering.title}
                    </h3>
                    <p className="text-muted mt-1 text-sm">
                      {offering.description ?? "Sin descripción."}
                    </p>
                  </div>
                  <Badge tone={offering.active ? "success" : "neutral"}>
                    {offering.active ? "Activa" : "Archivada"}
                  </Badge>
                </div>

                <p className="text-muted mt-3 text-xs">
                  {offering.type === "group" ? "Grupal" : "Uno a uno"} ·{" "}
                  {offering.durationMinutes} min · {formatPrice(offering)}
                </p>

                {offering.active ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(offering)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      loading={busyId === offering.id}
                      onClick={() => void handleArchive(offering)}
                    >
                      Archivar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
