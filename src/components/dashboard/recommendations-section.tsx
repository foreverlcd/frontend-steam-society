"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getRecommendations, type Recommendation } from "@/lib/api/catalog";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { isApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { formatPrice, mentorDisplayName } from "@/lib/catalog/format";

type Status = "loading" | "ready" | "empty" | "needs-profile" | "error";

export function RecommendationsSection() {
  const { user, refresh } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "mentee") {
      return;
    }

    const controller = new AbortController();

    void getRecommendations(3, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setItems(response.items);
        setStatus(response.items.length > 0 ? "ready" : "empty");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        if (
          isApiError(caught) &&
          (caught.code === "MENTEE_PROFILE_REQUIRED" ||
            caught.code === "ONBOARDING_INCOMPLETE")
        ) {
          setStatus("needs-profile");
          return;
        }

        setError(
          getErrorMessage(caught, "No pudimos cargar tus recomendaciones."),
        );
        setStatus("error");
      });

    return () => controller.abort();
  }, [refresh, user]);

  if (!user || user.role !== "mentee") {
    return null;
  }

  return (
    <section className="border-line rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
            Recomendaciones
          </p>
          <h2 className="text-ink mt-2 text-xl font-semibold tracking-tight">
            Mentoras afines a ti
          </h2>
          <p className="text-muted mt-2 max-w-xl text-sm leading-6">
            Calculadas con tus áreas, idioma, nivel y disponibilidad del
            onboarding.
          </p>
        </div>
        <Link
          href="/mentors"
          className={buttonClassName({ variant: "secondary", size: "sm" })}
        >
          Ver catálogo completo
        </Link>
      </div>

      {status === "loading" ? (
        <div className="text-muted mt-5 flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Buscando mentoras para ti…</span>
        </div>
      ) : null}

      {status === "needs-profile" ? (
        <Alert tone="info" className="mt-5">
          Completa tu onboarding y tu perfil de mentorada para recibir
          recomendaciones.{" "}
          <Link href="/onboarding" className="font-semibold underline">
            Ir al onboarding
          </Link>
          .
        </Alert>
      ) : null}

      {status === "empty" ? (
        <p className="border-line text-muted mt-5 rounded-2xl border border-dashed px-5 py-6 text-sm">
          Aún no hay mentoras compatibles con tu perfil. Mientras tanto, explora
          el catálogo completo.
        </p>
      ) : null}

      {status === "error" ? (
        <Alert tone="error" className="mt-5">
          {error ?? "No pudimos cargar tus recomendaciones."}
        </Alert>
      ) : null}

      {status === "ready" ? (
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {items.map((recommendation) => (
            <li key={recommendation.mentorId}>
              <Link
                href={`/mentors/${recommendation.mentorId}`}
                className="border-line hover:border-brand-300 hover:bg-brand-50/40 flex h-full flex-col rounded-2xl border p-5 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-ink text-base font-semibold">
                    {mentorDisplayName(recommendation.mentor)}
                  </h3>
                  <Badge tone="brand">
                    {Math.round(recommendation.score)} pts
                  </Badge>
                </div>
                <p className="text-muted mt-1 text-xs">
                  {recommendation.mentor.headline ?? "Mentora STEAM"}
                </p>
                <p className="text-muted mt-3 text-sm leading-6">
                  {recommendation.reason}
                </p>
                {recommendation.mentor.offerings.length > 0 ? (
                  <p className="text-brand-700 mt-auto pt-4 text-xs font-semibold">
                    Desde{" "}
                    {formatPrice(
                      recommendation.mentor.offerings.reduce(
                        (lowest, offering) =>
                          offering.priceMinor < lowest.priceMinor
                            ? offering
                            : lowest,
                      ),
                    )}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
