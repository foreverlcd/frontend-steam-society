"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { getOnboarding, type OnboardingData } from "@/lib/api/onboarding";
import {
  getProfile,
  submitMentorProfile,
  updateProfile,
  type MenteeProfile,
  type MentorProfile,
} from "@/lib/api/profiles";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/cn";

type Status = "loading" | "ready" | "error";

const CAREER_STAGES: Array<{
  value: NonNullable<MenteeProfile["careerStage"]>;
  label: string;
}> = [
  { value: "school", label: "Escolar" },
  { value: "preuniversity", label: "Preuniversitaria" },
  { value: "university", label: "Universitaria" },
  { value: "early_career", label: "Inicios de carrera" },
];

const EDUCATION_LEVELS: Array<{
  value: NonNullable<MenteeProfile["educationLevel"]>;
  label: string;
}> = [
  { value: "school", label: "Escolar" },
  { value: "undergraduate", label: "Pregrado" },
  { value: "graduate", label: "Posgrado" },
  { value: "career_change", label: "Cambio de carrera" },
  { value: "other", label: "Otro" },
];

const MENTOR_STATUS_LABELS: Record<MentorProfile["status"], string> = {
  draft: "Borrador",
  pending_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  suspended: "Suspendida",
};

export function ProfileView() {
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [mentee, setMentee] = useState<MenteeProfile | null>(null);
  const [options, setOptions] = useState<OnboardingData["options"] | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    const controller = new AbortController();

    void Promise.all([
      getProfile(controller.signal),
      getOnboarding(controller.signal),
    ])
      .then(([profile, onboarding]) => {
        if (controller.signal.aborted) {
          return;
        }

        setOptions(onboarding.options);

        if (profile.role === "mentor") {
          setMentor(
            (profile.profile as MentorProfile | null) ?? {
              userId: userId ?? "",
              headline: null,
              bio: null,
              yearsExperience: null,
              country: null,
              city: null,
              status: "draft",
              reviewedAt: null,
              rejectionReason: null,
              minNoticeHours: 24,
              maxAdvanceDays: 60,
              areas: [],
              languages: [],
            },
          );
        } else {
          setMentee(profile.profile as MenteeProfile | null);
        }

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
  }, [refresh, userId]);

  if (!user) {
    return null;
  }

  const isMentor = user.role === "mentor";

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          {isMentor ? "Mentora" : "Mentorada"}
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Mi perfil
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          {isMentor
            ? "Completa tu presentación pública y envíala a revisión cuando esté lista."
            : "Actualiza tus objetivos, intereses e idioma para mejorar tus recomendaciones."}
        </p>
      </header>

      {status === "loading" ? (
        <div className="text-muted mt-8 flex items-center gap-3 text-sm">
          <Spinner className="size-4" />
          <span>Cargando tu perfil…</span>
        </div>
      ) : null}

      {status === "error" ? (
        <Alert tone="error" className="mt-8">
          {error ?? "No pudimos cargar tu perfil."}
        </Alert>
      ) : null}

      {status === "ready" ? (
        <>
          {isMentor && mentor ? (
            <section className="border-line mt-6 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-ink text-sm font-semibold">
                    Estado del perfil
                  </span>
                  <Badge
                    tone={
                      mentor.status === "approved"
                        ? "success"
                        : mentor.status === "rejected"
                          ? "danger"
                          : "brand"
                    }
                  >
                    {MENTOR_STATUS_LABELS[mentor.status]}
                  </Badge>
                </div>
                {mentor.status === "draft" || mentor.status === "rejected" ? (
                  <Button
                    type="button"
                    size="sm"
                    loading={submitting}
                    onClick={() => void handleSubmitProfile()}
                  >
                    Enviar a revisión
                  </Button>
                ) : null}
              </div>
              {mentor.status === "rejected" && mentor.rejectionReason ? (
                <p className="text-danger-700 mt-3 text-sm">
                  Motivo del rechazo: {mentor.rejectionReason}
                </p>
              ) : null}
              {mentor.status === "approved" ? (
                <p className="text-muted mt-3 text-sm">
                  Tu perfil es público en el catálogo. Recuerda publicar al
                  menos una oferta activa y tu disponibilidad.
                </p>
              ) : null}
            </section>
          ) : null}

          {notice ? (
            <Alert tone="success" className="mt-5">
              {notice}
            </Alert>
          ) : null}

          {formError ? (
            <Alert tone="error" className="mt-5">
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {isMentor ? (
              <MentorFields profile={mentor} onChange={setMentor} />
            ) : (
              <MenteeFields profile={mentee} onChange={setMentee} />
            )}

            {options ? (
              <>
                <AreaPicker
                  options={options.areas}
                  selected={isMentor ? mentor?.areas : mentee?.areas}
                  max={isMentor ? 5 : 3}
                  onChange={(areas) => {
                    if (isMentor) {
                      setMentor((current) =>
                        current ? { ...current, areas } : current,
                      );
                    } else {
                      setMentee((current) =>
                        current ? { ...current, areas } : current,
                      );
                    }
                  }}
                />

                <LanguagePicker
                  options={options.languages}
                  selected={isMentor ? mentor?.languages : mentee?.languages}
                  onChange={(languages) => {
                    if (isMentor) {
                      setMentor((current) =>
                        current ? { ...current, languages } : current,
                      );
                    } else {
                      setMentee((current) =>
                        current ? { ...current, languages } : current,
                      );
                    }
                  }}
                />
              </>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={saving}>
                Guardar perfil
              </Button>
              <Link
                href="/onboarding"
                className="text-muted hover:text-ink self-center px-3 py-2 text-sm font-medium"
              >
                Editar respuestas del onboarding
              </Link>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setFormError(null);

    try {
      const input = isMentor
        ? {
            headline: mentor?.headline ?? null,
            bio: mentor?.bio ?? null,
            yearsExperience: mentor?.yearsExperience ?? null,
            country: mentor?.country ?? null,
            city: mentor?.city ?? null,
            areaIds: mentor?.areas.map((area) => area.id) ?? [],
            languageCodes:
              mentor?.languages.map((language) => language.code) ?? [],
          }
        : {
            goals: mentee?.goals ?? null,
            educationLevel: mentee?.educationLevel ?? null,
            careerStage: mentee?.careerStage ?? null,
            country: mentee?.country ?? null,
            city: mentee?.city ?? null,
            areaIds: mentee?.areas.map((area) => area.id) ?? [],
            languageCodes:
              mentee?.languages.map((language) => language.code) ?? [],
          };

      const response = await updateProfile(input);

      if (response.role === "mentor") {
        setMentor(response.profile as MentorProfile | null);
      } else {
        setMentee(response.profile as MenteeProfile | null);
      }

      setNotice("Perfil guardado.");
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setFormError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitProfile() {
    setSubmitting(true);
    setNotice(null);
    setFormError(null);

    try {
      const response = await submitMentorProfile();
      setMentor(response.profile);
      setNotice("Perfil enviado a revisión.");
    } catch (caught: unknown) {
      if (isUnauthorized(caught)) {
        void refresh();
      }

      setFormError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }
}

function MentorFields({
  profile,
  onChange,
}: {
  profile: MentorProfile | null;
  onChange: (profile: MentorProfile | null) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor="profile-headline"
          className="text-ink block text-sm font-medium"
        >
          Titular
        </label>
        <Input
          id="profile-headline"
          maxLength={160}
          value={profile?.headline ?? ""}
          onChange={(event) =>
            onChange(
              profile
                ? { ...profile, headline: event.target.value || null }
                : null,
            )
          }
          placeholder="Ingeniera de software y mentora en tecnología"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="profile-bio"
          className="text-ink block text-sm font-medium"
        >
          Biografía
        </label>
        <textarea
          id="profile-bio"
          rows={5}
          maxLength={4000}
          value={profile?.bio ?? ""}
          onChange={(event) =>
            onChange(
              profile ? { ...profile, bio: event.target.value || null } : null,
            )
          }
          className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
          placeholder="Cuéntale a las mentoradas tu experiencia y cómo puedes ayudarlas."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label
            htmlFor="profile-years"
            className="text-ink block text-sm font-medium"
          >
            Años de experiencia
          </label>
          <Input
            id="profile-years"
            type="number"
            min={0}
            max={80}
            value={profile?.yearsExperience ?? ""}
            onChange={(event) =>
              onChange(
                profile
                  ? {
                      ...profile,
                      yearsExperience: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }
                  : null,
              )
            }
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="profile-country"
            className="text-ink block text-sm font-medium"
          >
            País (ISO)
          </label>
          <Input
            id="profile-country"
            maxLength={2}
            value={profile?.country ?? ""}
            onChange={(event) =>
              onChange(
                profile
                  ? {
                      ...profile,
                      country: event.target.value.toUpperCase() || null,
                    }
                  : null,
              )
            }
            placeholder="PE"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="profile-city"
            className="text-ink block text-sm font-medium"
          >
            Ciudad
          </label>
          <Input
            id="profile-city"
            maxLength={100}
            value={profile?.city ?? ""}
            onChange={(event) =>
              onChange(
                profile
                  ? { ...profile, city: event.target.value || null }
                  : null,
              )
            }
          />
        </div>
      </div>
    </>
  );
}

function MenteeFields({
  profile,
  onChange,
}: {
  profile: MenteeProfile | null;
  onChange: (profile: MenteeProfile | null) => void;
}) {
  const empty: MenteeProfile = {
    userId: "",
    goals: null,
    educationLevel: null,
    careerStage: null,
    country: null,
    city: null,
    areas: [],
    languages: [],
  };
  const current = profile ?? empty;

  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor="profile-goals"
          className="text-ink block text-sm font-medium"
        >
          Mis objetivos
        </label>
        <textarea
          id="profile-goals"
          rows={4}
          maxLength={2000}
          value={current.goals ?? ""}
          onChange={(event) =>
            onChange({ ...current, goals: event.target.value || null })
          }
          className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
          placeholder="¿Qué te gustaría lograr con una mentora?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="profile-stage"
            className="text-ink block text-sm font-medium"
          >
            Etapa
          </label>
          <select
            id="profile-stage"
            value={current.careerStage ?? ""}
            onChange={(event) =>
              onChange({
                ...current,
                careerStage:
                  (event.target.value as MenteeProfile["careerStage"]) || null,
              })
            }
            className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
          >
            <option value="">Sin definir</option>
            {CAREER_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="profile-education"
            className="text-ink block text-sm font-medium"
          >
            Nivel educativo
          </label>
          <select
            id="profile-education"
            value={current.educationLevel ?? ""}
            onChange={(event) =>
              onChange({
                ...current,
                educationLevel:
                  (event.target.value as MenteeProfile["educationLevel"]) ||
                  null,
              })
            }
            className="border-line text-ink focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
          >
            <option value="">Sin definir</option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="profile-country"
            className="text-ink block text-sm font-medium"
          >
            País (ISO)
          </label>
          <Input
            id="profile-country"
            maxLength={2}
            value={current.country ?? ""}
            onChange={(event) =>
              onChange({
                ...current,
                country: event.target.value.toUpperCase() || null,
              })
            }
            placeholder="PE"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="profile-city"
            className="text-ink block text-sm font-medium"
          >
            Ciudad
          </label>
          <Input
            id="profile-city"
            maxLength={100}
            value={current.city ?? ""}
            onChange={(event) =>
              onChange({ ...current, city: event.target.value || null })
            }
          />
        </div>
      </div>
    </>
  );
}

function AreaPicker({
  options,
  selected,
  max,
  onChange,
}: {
  options: OnboardingData["options"]["areas"];
  selected:
    Array<{ id: string; name: string; parentId: string | null }> | undefined;
  max: number;
  onChange: (
    areas: Array<{ id: string; name: string; parentId: string | null }>,
  ) => void;
}) {
  const current = selected ?? [];
  const selectedIds = new Set(current.map((area) => area.id));

  return (
    <fieldset>
      <legend className="text-ink text-sm font-medium">
        Áreas de interés (máximo {max})
      </legend>
      <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
        {options.map((area) => {
          const checked = selectedIds.has(area.id);
          const disabled = !checked && current.length >= max;

          return (
            <label
              key={area.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                checked ? "border-brand-500 bg-brand-50" : "border-line",
                disabled && "opacity-50",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...current, area]
                      : current.filter((item) => item.id !== area.id),
                  )
                }
                className="accent-brand-600 size-4"
              />
              <span className="text-ink">{area.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function LanguagePicker({
  options,
  selected,
  onChange,
}: {
  options: OnboardingData["options"]["languages"];
  selected: Array<{ code: string; name: string }> | undefined;
  onChange: (languages: Array<{ code: string; name: string }>) => void;
}) {
  const current = selected ?? [];
  const selectedCodes = new Set(current.map((language) => language.code));

  return (
    <fieldset>
      <legend className="text-ink text-sm font-medium">Idiomas</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((language) => {
          const checked = selectedCodes.has(language.code);

          return (
            <label
              key={language.code}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                checked ? "border-brand-500 bg-brand-50" : "border-line",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...current, language]
                      : current.filter((item) => item.code !== language.code),
                  )
                }
                className="accent-brand-600 size-4"
              />
              <span className="text-ink">{language.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
