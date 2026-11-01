"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getRecommendations,
  listMentors,
  type CatalogMentor,
} from "@/lib/api/catalog";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { getOnboarding, type OnboardingData } from "@/lib/api/onboarding";
import { useAuth } from "@/lib/auth/auth-context";
import {
  formatAreas,
  formatLanguages,
  formatPrice,
  mentorDisplayName,
} from "@/lib/catalog/format";

interface Filters {
  q: string;
  areaId: string;
  language: string;
  country: string;
  isFree: boolean;
  maxPrice: string;
}

const EMPTY_FILTERS: Filters = {
  q: "",
  areaId: "",
  language: "",
  country: "",
  isFree: false,
  maxPrice: "",
};

type LoadStatus = "loading" | "ready" | "error";

export function CatalogView() {
  const { user, refresh } = useAuth();
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [items, setItems] = useState<CatalogMentor[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [options, setOptions] = useState<OnboardingData["options"] | null>(
    null,
  );
  const [recommendationCount, setRecommendationCount] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();

    void getOnboarding(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setOptions(data.options);
        }
      })
      .catch(() => undefined);

    if (user.role === "mentee") {
      void getRecommendations(3, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setRecommendationCount(data.items.length);
          }
        })
        .catch(() => undefined);
    }

    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    void listMentors(toQuery(filters), controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setItems(response.items);
        setNextCursor(response.nextCursor);
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
  }, [filters, refresh]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setFilters(draft);
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    setStatus("loading");
    setError(null);
    setFilters(EMPTY_FILTERS);
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await listMentors({
        ...toQuery(filters),
        cursor: nextCursor,
      });

      setItems((current) => {
        const known = new Set(current.map((mentor) => mentor.userId));

        return [
          ...current,
          ...response.items.filter((mentor) => !known.has(mentor.userId)),
        ];
      });
      setNextCursor(response.nextCursor);
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      } else {
        setError(getErrorMessage(caught));
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="max-w-3xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Catálogo
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Encuentra a tu mentora
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Explora mentoras aprobadas por Steam Society, filtra por área, idioma
          o precio y abre su perfil para ver horarios.
        </p>
        {recommendationCount !== null && recommendationCount > 0 ? (
          <p className="text-brand-700 mt-3 text-sm font-medium">
            Tenemos {recommendationCount} recomendaciones para ti en tu panel.
          </p>
        ) : null}
      </header>

      <form
        onSubmit={handleSubmit}
        className="border-line mt-8 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-ink text-sm font-medium">Buscar</span>
          <Input
            value={draft.q}
            onChange={(event) =>
              setDraft((current) => ({ ...current, q: event.target.value }))
            }
            placeholder="Datos, robótica, liderazgo…"
          />
        </label>

        {options ? (
          <label className="space-y-1.5">
            <span className="text-ink text-sm font-medium">Área</span>
            <select
              value={draft.areaId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  areaId: event.target.value,
                }))
              }
              className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
            >
              <option value="">Todas</option>
              {options.areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {options ? (
          <label className="space-y-1.5">
            <span className="text-ink text-sm font-medium">Idioma</span>
            <select
              value={draft.language}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  language: event.target.value,
                }))
              }
              className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
            >
              <option value="">Todos</option>
              {options.languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="space-y-1.5">
          <span className="text-ink text-sm font-medium">País</span>
          <Input
            value={draft.country}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                country: event.target.value.toUpperCase().slice(0, 2),
              }))
            }
            placeholder="PE"
            maxLength={2}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-ink text-sm font-medium">
            Precio máximo (S/)
          </span>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={draft.maxPrice}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                maxPrice: event.target.value,
              }))
            }
            placeholder="Sin límite"
          />
        </label>

        <label className="flex items-center gap-2 pt-6 text-sm">
          <input
            type="checkbox"
            checked={draft.isFree}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                isFree: event.target.checked,
              }))
            }
            className="text-brand-600 focus:ring-brand-500 size-4 rounded border"
          />
          <span className="text-ink font-medium">Solo gratuitas</span>
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit">Aplicar filtros</Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Limpiar
          </Button>
        </div>
      </form>

      {status === "error" ? (
        <Alert tone="error" className="mt-6">
          {error ?? "No pudimos cargar el catálogo."}
        </Alert>
      ) : null}

      {status === "loading" ? (
        <p className="text-muted mt-8 text-sm">Cargando mentoras…</p>
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <div className="border-line text-muted mt-8 rounded-3xl border border-dashed px-6 py-12 text-center text-sm">
          <p className="text-ink text-base font-semibold">
            No encontramos mentoras con esos filtros.
          </p>
          <p className="mt-2">
            Prueba con otra búsqueda o limpia los filtros. También puedes
            revisar tus recomendaciones si ya completaste tu onboarding.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {items.map((mentor) => (
          <article
            key={mentor.userId}
            className="border-line flex flex-col rounded-3xl border bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-ink text-lg font-semibold">
                  {mentorDisplayName(mentor)}
                </h2>
                <p className="text-muted mt-1 text-sm">
                  {mentor.headline ?? "Mentora STEAM"}
                </p>
              </div>
              <Badge
                tone={
                  mentor.offerings.some((offering) => offering.isFree)
                    ? "success"
                    : "brand"
                }
              >
                {mentor.offerings.some((offering) => offering.isFree)
                  ? "Tiene oferta gratis"
                  : "Ofertas de pago"}
              </Badge>
            </div>

            <p className="text-muted mt-4 text-sm leading-6">
              {mentor.bio ?? "Perfil en construcción."}
            </p>

            <dl className="text-muted mt-4 grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-ink font-semibold">Áreas</dt>
                <dd>{formatAreas(mentor)}</dd>
              </div>
              <div>
                <dt className="text-ink font-semibold">Idiomas</dt>
                <dd>{formatLanguages(mentor)}</dd>
              </div>
              <div>
                <dt className="text-ink font-semibold">Ubicación</dt>
                <dd>
                  {[mentor.city, mentor.country].filter(Boolean).join(", ") ||
                    "Sin completar"}
                </dd>
              </div>
              <div>
                <dt className="text-ink font-semibold">Experiencia</dt>
                <dd>
                  {mentor.yearsExperience === null
                    ? "Sin completar"
                    : `${mentor.yearsExperience} años`}
                </dd>
              </div>
            </dl>

            <ul className="mt-4 space-y-2">
              {mentor.offerings.slice(0, 3).map((offering) => (
                <li
                  key={offering.id}
                  className="bg-canvas flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
                >
                  <span className="text-ink font-medium">{offering.title}</span>
                  <span className="text-muted text-xs">
                    {offering.durationMinutes} min · {formatPrice(offering)}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={`/mentors/${mentor.userId}`}
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "mt-5 w-fit",
              })}
            >
              Ver perfil y horarios
            </Link>
          </article>
        ))}
      </div>

      {nextCursor ? (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            loading={loadingMore}
            onClick={() => void handleLoadMore()}
          >
            Cargar más mentoras
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function toQuery(filters: Filters) {
  return {
    q: filters.q.trim() || undefined,
    areaId: filters.areaId || undefined,
    language: filters.language || undefined,
    country: filters.country || undefined,
    isFree: filters.isFree ? true : undefined,
    maxPriceMinor: filters.maxPrice
      ? Math.round(Number(filters.maxPrice) * 100)
      : undefined,
  };
}
