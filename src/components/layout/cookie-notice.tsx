"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ss-cookie-notice";
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "seen";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function dismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "seen");
  } catch {
    // Private mode: the notice simply shows again next time.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Informative notice. The site only sets the strictly necessary session
 * cookie, so there is nothing to accept or reject; the choice is remembered
 * in localStorage, not in another cookie. Hidden on the server render.
 */
export function CookieNotice() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="border-line fixed inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-xl sm:right-auto sm:left-4 sm:max-w-sm"
    >
      <p className="text-muted text-xs leading-5">
        Usamos una sola cookie, necesaria para mantener tu sesión. Sin
        publicidad ni analítica.{" "}
        <Link href="/cookies" className="text-brand-700 font-medium underline">
          Más información
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="bg-ink hover:bg-brand-800 focus-visible:ring-brand-500 shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Entendido
      </button>
    </div>
  );
}
