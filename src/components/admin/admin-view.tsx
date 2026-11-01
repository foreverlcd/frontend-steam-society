"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  approveMentor,
  getAdminMentor,
  listAdminMentors,
  reactivateMentor,
  rejectMentor,
  suspendMentor,
  type AdminMentor,
  type AdminMentorDetail,
  type MentorStatus,
} from "@/lib/api/admin-mentors";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import {
  formatAnswer,
  formatDate,
  MENTOR_STATUS_FILTERS,
  MENTOR_STATUS_LABELS,
  mentorDisplayName,
} from "@/lib/admin/mentor-review";
import { useAuth } from "@/lib/auth/auth-context";
import { userStatusLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/cn";
import { getMissingQuestionLabels } from "@/lib/onboarding/answers";

type LoadStatus = "loading" | "ready" | "error";
type DetailStatus = "idle" | "loading" | "ready" | "error";
type ActionKind = "approve" | "reject" | "suspend" | "reactivate";

function statusTone(status: MentorStatus): BadgeTone {
  if (status === "approved") {
    return "success";
  }

  if (status === "pending_review") {
    return "brand";
  }

  if (status === "rejected" || status === "suspended") {
    return "danger";
  }

  return "neutral";
}

function StatusBadge({ status }: { status: MentorStatus }) {
  return (
    <Badge tone={statusTone(status)}>{MENTOR_STATUS_LABELS[status]}</Badge>
  );
}

function LoadingBlock({ message }: { message: string }) {
  return (
    <div className="text-muted flex items-center gap-3 px-1 py-6 text-sm">
      <Spinner className="size-4" />
      <span>{message}</span>
    </div>
  );
}

function EmptyBlock({ children }: { children: string }) {
  return (
    <p className="border-line bg-canvas text-muted mt-4 rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
      {children}
    </p>
  );
}

function locationLabel(mentor: AdminMentor): string {
  return (
    [mentor.city, mentor.country].filter(Boolean).join(", ") || "Sin completar"
  );
}

function experienceLabel(mentor: AdminMentor): string {
  return mentor.yearsExperience === null
    ? "Sin completar"
    : `${mentor.yearsExperience} años`;
}

export function AdminView() {
  const { user, refresh } = useAuth();
  const [statusFilter, setStatusFilter] = useState<MentorStatus | "all">(
    "pending_review",
  );
  const [items, setItems] = useState<AdminMentor[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listStatus, setListStatus] = useState<LoadStatus>("loading");
  const [listError, setListError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listReload, setListReload] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminMentorDetail | null>(null);
  const [detailError, setDetailError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [detailReload, setDetailReload] = useState(0);
  const [action, setAction] = useState<ActionKind | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    void listAdminMentors(
      { status: statusFilter === "all" ? undefined : statusFilter },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setItems(response.items);
        setNextCursor(response.nextCursor);
        setListStatus("ready");
        setSelectedId((current) =>
          current && response.items.some((item) => item.userId === current)
            ? current
            : (response.items[0]?.userId ?? null),
        );
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        setListError(getErrorMessage(caught));
        setListStatus("error");
      });

    return () => controller.abort();
  }, [refresh, statusFilter, listReload]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const controller = new AbortController();

    void getAdminMentor(selectedId, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        setDetail(response);
        setDetailError(null);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        setDetailError({
          id: selectedId,
          message: getErrorMessage(caught),
        });
      });

    return () => controller.abort();
  }, [refresh, selectedId, detailReload]);

  function handleFilterChange(next: MentorStatus | "all") {
    setStatusFilter(next);
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setListStatus("loading");
    setListError(null);
    setActionError(null);
    setActionSuccess(null);
    setRejecting(false);
    setReason("");
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setDetail(null);
    setDetailError(null);
    setActionError(null);
    setActionSuccess(null);
    setRejecting(false);
    setReason("");
  }

  function handleListRetry() {
    setListStatus("loading");
    setListError(null);
    setListReload((current) => current + 1);
  }

  function handleDetailRetry() {
    setDetail(null);
    setDetailError(null);
    setDetailReload((current) => current + 1);
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setListError(null);

    try {
      const response = await listAdminMentors({
        status: statusFilter === "all" ? undefined : statusFilter,
        cursor: nextCursor,
      });

      setItems((current) => {
        const known = new Set(current.map((item) => item.userId));

        return [
          ...current,
          ...response.items.filter((item) => !known.has(item.userId)),
        ];
      });
      setNextCursor(response.nextCursor);
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setListError(getErrorMessage(caught));
    } finally {
      setLoadingMore(false);
    }
  }

  async function runAction(
    kind: ActionKind,
    request: () => Promise<unknown>,
    successMessage: string,
  ) {
    if (action) {
      return;
    }

    setAction(kind);
    setActionError(null);
    setActionSuccess(null);

    try {
      await request();
      setActionSuccess(successMessage);
      setRejecting(false);
      setReason("");
      setDetail(null);
      setDetailError(null);
      setDetailReload((current) => current + 1);
      setListReload((current) => current + 1);
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setActionError(getErrorMessage(caught));
    } finally {
      setAction(null);
    }
  }

  function handleReject() {
    const trimmed = reason.trim();

    if (!selectedId || !trimmed) {
      return;
    }

    void runAction(
      "reject",
      () => rejectMentor(selectedId, trimmed),
      "Perfil rechazado. La mentora podrá corregirlo y reenviarlo.",
    );
  }

  if (!user) {
    return null;
  }

  const selectedDetail =
    detail && detail.mentor.userId === selectedId ? detail : null;
  const selectedDetailError =
    detailError && detailError.id === selectedId ? detailError.message : null;
  const detailStatus: DetailStatus = !selectedId
    ? "idle"
    : selectedDetailError
      ? "error"
      : selectedDetail
        ? "ready"
        : "loading";
  const missingLabels = selectedDetail
    ? getMissingQuestionLabels(
        selectedDetail.onboarding.steps,
        selectedDetail.onboarding.completion.missing,
      )
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="max-w-2xl">
        <p className="text-brand-700 text-xs font-semibold tracking-[0.18em] uppercase">
          Administración
        </p>
        <h1 className="text-ink mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Panel de mentoras
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Revisa el onboarding completo antes de aprobar, rechazar o suspender
          un perfil.
        </p>
        <p className="text-muted mt-2 text-xs">
          Sesión iniciada como {user.email}.
        </p>
      </header>

      {actionSuccess ? (
        <Alert tone="success" className="mt-6">
          {actionSuccess}
        </Alert>
      ) : null}

      {actionError ? (
        <Alert tone="error" className="mt-6">
          {actionError}
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section
          aria-label="Bandeja de revisión"
          className="border-line h-fit rounded-3xl border bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-ink text-base font-semibold">
                Bandeja de revisión
              </h2>
              <p className="text-muted mt-1 text-sm leading-6">
                Filtra por estado y elige una mentora para ver su detalle.
              </p>
            </div>

            <div
              role="group"
              aria-label="Filtrar mentoras por estado"
              className="flex flex-wrap gap-2"
            >
              {MENTOR_STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleFilterChange(filter.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line text-muted hover:border-brand-300 hover:text-ink bg-white",
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {listStatus === "loading" ? (
            <LoadingBlock message="Cargando mentoras..." />
          ) : listStatus === "error" ? (
            <div className="mt-4">
              <Alert tone="error">
                {listError ?? "No pudimos cargar la bandeja."}
              </Alert>
              <Button type="button" className="mt-3" onClick={handleListRetry}>
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 ? (
            <EmptyBlock>No hay mentoras en este estado.</EmptyBlock>
          ) : (
            <>
              <ul className="mt-4 space-y-2">
                {items.map((item) => {
                  const selected = item.userId === selectedId;

                  return (
                    <li key={item.userId}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.userId)}
                        aria-current={selected ? "true" : undefined}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition",
                          selected
                            ? "border-brand-500 bg-brand-50 ring-brand-500/20 ring-2"
                            : "border-line hover:border-brand-300 bg-white",
                        )}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="text-ink block truncate text-sm font-semibold">
                              {mentorDisplayName(item)}
                            </span>
                            <span className="text-muted mt-0.5 block truncate text-xs">
                              {item.email}
                            </span>
                          </span>
                          <StatusBadge status={item.status} />
                        </span>
                        <span className="text-muted mt-2 block text-xs">
                          {locationLabel(item)} · {experienceLabel(item)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {nextCursor ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 w-full"
                  loading={loadingMore}
                  onClick={() => void handleLoadMore()}
                >
                  Cargar más
                </Button>
              ) : null}

              {listError ? (
                <Alert tone="error" className="mt-4">
                  {listError}
                </Alert>
              ) : null}
            </>
          )}
        </section>

        <section
          aria-label="Detalle de la mentora"
          className="border-line rounded-3xl border bg-white p-5 shadow-sm sm:p-6"
        >
          {detailStatus === "loading" ? (
            <LoadingBlock message="Cargando detalle..." />
          ) : detailStatus === "error" ? (
            <div>
              <Alert tone="error">
                {selectedDetailError ?? "No pudimos cargar el detalle."}
              </Alert>
              <Button
                type="button"
                className="mt-3"
                onClick={handleDetailRetry}
              >
                Reintentar
              </Button>
            </div>
          ) : !selectedDetail || !selectedId ? (
            <EmptyBlock>
              Elige una mentora de la bandeja para revisar su perfil.
            </EmptyBlock>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-ink text-xl font-semibold tracking-tight">
                    {mentorDisplayName(selectedDetail.mentor)}
                  </h2>
                  <p className="text-muted mt-1 text-sm break-all">
                    {selectedDetail.mentor.email}
                  </p>
                </div>
                <StatusBadge status={selectedDetail.mentor.status} />
              </div>

              {selectedDetail.mentor.rejectionReason ? (
                <Alert tone="error">
                  Motivo del rechazo: {selectedDetail.mentor.rejectionReason}
                </Alert>
              ) : null}

              {selectedDetail.mentor.headline ? (
                <p className="text-ink text-sm font-medium">
                  {selectedDetail.mentor.headline}
                </p>
              ) : null}

              {selectedDetail.mentor.bio ? (
                <p className="text-muted text-sm leading-6 whitespace-pre-line">
                  {selectedDetail.mentor.bio}
                </p>
              ) : null}

              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted text-xs font-medium">
                    Estado de la cuenta
                  </dt>
                  <dd className="text-ink mt-1 text-sm">
                    {userStatusLabel(selectedDetail.mentor.userStatus)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium">Ubicación</dt>
                  <dd className="text-ink mt-1 text-sm">
                    {locationLabel(selectedDetail.mentor)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium">
                    Experiencia
                  </dt>
                  <dd className="text-ink mt-1 text-sm">
                    {experienceLabel(selectedDetail.mentor)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium">
                    Última revisión
                  </dt>
                  <dd className="text-ink mt-1 text-sm">
                    {formatDate(selectedDetail.mentor.reviewedAt) ??
                      "Sin revisar"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium">
                    Antelación mínima
                  </dt>
                  <dd className="text-ink mt-1 text-sm">
                    {selectedDetail.mentor.minNoticeHours} horas
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium">
                    Ventana máxima
                  </dt>
                  <dd className="text-ink mt-1 text-sm">
                    {selectedDetail.mentor.maxAdvanceDays} días
                  </dd>
                </div>
              </dl>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-ink text-sm font-semibold">Áreas</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDetail.mentor.areas.length > 0 ? (
                      selectedDetail.mentor.areas.map((area) => (
                        <Badge key={area.id} tone="neutral">
                          {area.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted text-sm">Sin áreas.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-ink text-sm font-semibold">Idiomas</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDetail.mentor.languages.length > 0 ? (
                      selectedDetail.mentor.languages.map((language) => (
                        <Badge key={language.code} tone="neutral">
                          {language.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted text-sm">Sin idiomas.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-line border-t pt-5">
                <h3 className="text-ink text-sm font-semibold">Acciones</h3>

                {selectedDetail.mentor.status === "pending_review" ? (
                  rejecting ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <label
                        htmlFor="reject-reason"
                        className="text-ink text-sm font-medium"
                      >
                        Motivo del rechazo
                      </label>
                      <textarea
                        id="reject-reason"
                        value={reason}
                        maxLength={1000}
                        rows={3}
                        onChange={(event) => setReason(event.target.value)}
                        className="border-line text-ink placeholder:text-muted/70 focus:border-brand-500 focus:ring-brand-500/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-sm transition outline-none focus:ring-4"
                        placeholder="Explica qué debe corregir la mentora."
                      />
                      <p className="text-muted text-xs">{reason.length}/1000</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="danger"
                          loading={action === "reject"}
                          disabled={!reason.trim() || action !== null}
                          onClick={handleReject}
                        >
                          Confirmar rechazo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={action !== null}
                          onClick={() => {
                            setRejecting(false);
                            setReason("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        loading={action === "approve"}
                        disabled={action !== null}
                        onClick={() =>
                          void runAction(
                            "approve",
                            () => approveMentor(selectedDetail.mentor.userId),
                            "Perfil aprobado.",
                          )
                        }
                      >
                        Aprobar perfil
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={action !== null}
                        onClick={() => setRejecting(true)}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )
                ) : selectedDetail.mentor.status === "approved" ? (
                  <Button
                    type="button"
                    variant="danger"
                    className="mt-3"
                    loading={action === "suspend"}
                    disabled={action !== null}
                    onClick={() =>
                      void runAction(
                        "suspend",
                        () => suspendMentor(selectedDetail.mentor.userId),
                        "Perfil suspendido.",
                      )
                    }
                  >
                    Suspender perfil
                  </Button>
                ) : selectedDetail.mentor.status === "suspended" ? (
                  <Button
                    type="button"
                    className="mt-3"
                    loading={action === "reactivate"}
                    disabled={action !== null}
                    onClick={() =>
                      void runAction(
                        "reactivate",
                        () => reactivateMentor(selectedDetail.mentor.userId),
                        "Perfil reactivado.",
                      )
                    }
                  >
                    Reactivar perfil
                  </Button>
                ) : selectedDetail.mentor.status === "rejected" ? (
                  <Alert tone="info" className="mt-3">
                    La mentora debe corregir su perfil y reenviarlo a revisión.
                  </Alert>
                ) : (
                  <Alert tone="info" className="mt-3">
                    La mentora todavía no ha enviado su perfil a revisión.
                  </Alert>
                )}
              </div>

              <div className="border-line border-t pt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-ink text-sm font-semibold">Onboarding</h3>
                  <Badge
                    tone={
                      selectedDetail.onboarding.completion.complete
                        ? "success"
                        : "brand"
                    }
                  >
                    {selectedDetail.onboarding.completion.complete
                      ? "Completo"
                      : `Faltan ${selectedDetail.onboarding.completion.missing.length}`}
                  </Badge>
                </div>

                {missingLabels.length > 0 ? (
                  <p className="text-muted mt-2 text-xs">
                    Pendiente: {missingLabels.join(", ")}.
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-3">
                  {selectedDetail.onboarding.steps.map((step) => (
                    <section
                      key={step.code}
                      className="border-line rounded-2xl border p-4"
                    >
                      <h4 className="text-ink text-sm font-semibold">
                        {step.title}
                      </h4>
                      <dl className="divide-line mt-2 divide-y">
                        {step.questions.map((question) => (
                          <div
                            key={question.code}
                            className="grid gap-1 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-3"
                          >
                            <dt className="text-muted text-xs font-medium">
                              {question.label}
                            </dt>
                            <dd className="text-ink text-sm">
                              {formatAnswer(
                                question,
                                selectedDetail.onboarding.answers[
                                  question.code
                                ],
                                selectedDetail.onboarding.options,
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
