"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";

export type AdminLoadStatus = "loading" | "ready" | "error";

interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

type QueryValue = string | number | undefined;

/**
 * Cursor-paginated admin list. The list reloads whenever `query` changes
 * (compared by value) or `reload()` is called; `loadMore()` appends the next
 * page. A 401 refreshes the session so the guard can send the person to login.
 */
export function usePagedList<T extends { id: string }, Q extends object>(
  fetcher: (
    query: Q & { cursor?: string },
    signal?: AbortSignal,
  ) => Promise<Page<T>>,
  query: Q,
) {
  const { refresh } = useAuth();
  const queryKey = JSON.stringify(query);
  const [reloadToken, setReloadToken] = useState(0);
  const requestKey = `${queryKey}#${reloadToken}`;
  const [state, setState] = useState<{
    key: string | null;
    items: T[];
    nextCursor: string | null;
    error: string | null;
  }>({ key: null, items: [], nextCursor: null, error: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const parsed = JSON.parse(queryKey) as Q;

    void fetcher(parsed, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          key: requestKey,
          items: page.items,
          nextCursor: page.nextCursor,
          error: null,
        });
        setMoreError(null);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        setState({
          key: requestKey,
          items: [],
          nextCursor: null,
          error: getErrorMessage(caught),
        });
      });

    return () => controller.abort();
  }, [fetcher, queryKey, requestKey, refresh]);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const current = state.key === requestKey;
  const status: AdminLoadStatus = !current
    ? "loading"
    : state.error
      ? "error"
      : "ready";

  async function loadMore() {
    if (!current || !state.nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setMoreError(null);

    try {
      const page = await fetcher({
        ...(JSON.parse(queryKey) as Q),
        cursor: state.nextCursor,
      });

      setState((previous) => {
        const known = new Set(previous.items.map((item) => item.id));

        return {
          ...previous,
          items: [
            ...previous.items,
            ...page.items.filter((item) => !known.has(item.id)),
          ],
          nextCursor: page.nextCursor,
        };
      });
    } catch (caught) {
      if (isUnauthorized(caught)) {
        await refresh();
        return;
      }

      setMoreError(getErrorMessage(caught));
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    items: current ? state.items : [],
    nextCursor: current ? state.nextCursor : null,
    status,
    error: current ? state.error : null,
    loadingMore,
    moreError,
    loadMore,
    reload,
  };
}

/** Loads one admin resource by id (or nothing when `id` is null). */
export function useAdminResource<T>(
  fetcher: (id: string, signal?: AbortSignal) => Promise<T>,
  id: string | null,
) {
  const { refresh } = useAuth();
  const [reloadToken, setReloadToken] = useState(0);
  const requestKey = id ? `${id}#${reloadToken}` : null;
  const [state, setState] = useState<{
    key: string | null;
    data: T | null;
    error: string | null;
  }>({ key: null, data: null, error: null });

  useEffect(() => {
    if (!id || !requestKey) {
      return;
    }

    const controller = new AbortController();

    void fetcher(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ key: requestKey, data, error: null });
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          void refresh();
          return;
        }

        setState({
          key: requestKey,
          data: null,
          error: getErrorMessage(caught),
        });
      });

    return () => controller.abort();
  }, [fetcher, id, requestKey, refresh]);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const current = requestKey !== null && state.key === requestKey;
  const status: AdminLoadStatus | "idle" = !id
    ? "idle"
    : !current
      ? "loading"
      : state.error
        ? "error"
        : "ready";

  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    status,
    reload,
  };
}
