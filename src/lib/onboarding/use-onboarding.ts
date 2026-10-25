"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { getOnboarding, type OnboardingData } from "@/lib/api/onboarding";
import { useAuth } from "@/lib/auth/auth-context";

export type OnboardingLoadStatus = "loading" | "ready" | "error";

export function useOnboarding() {
  const { refresh } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [status, setStatus] = useState<OnboardingLoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getOnboarding(controller.signal)
      .then((next) => {
        if (controller.signal.aborted) {
          return;
        }

        setData(next);
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
  }, [refresh, reloadToken]);

  return { data, status, error, reload, setData };
}
