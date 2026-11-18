"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/account/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api/errors";
import { listBlocks, unblockUser, type BlockedUser } from "@/lib/api/safety";

/** People the user blocked, with the option to unblock (Account page). */
export function BlockedCard() {
  const [items, setItems] = useState<BlockedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listBlocks(controller.signal)
      .then(setItems)
      .catch((caught: unknown) => {
        if (caught instanceof Error && caught.name === "AbortError") return;
        setError(getErrorMessage(caught));
      });
    return () => controller.abort();
  }, []);

  async function unblock(person: BlockedUser) {
    setBusyId(person.userId);
    setError(null);
    try {
      await unblockUser(person.userId);
      setItems(
        (current) => current?.filter((p) => p.userId !== person.userId) ?? [],
      );
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <div>
        <h2 className="text-ink text-base font-semibold">
          Personas bloqueadas
        </h2>
        <p className="text-muted mt-1 text-sm">
          No pueden reservar contigo ni tú con ellas. No saben que las
          bloqueaste. Para reportar a alguien, usa “Reportar o bloquear” en tus
          reservas o{" "}
          <Link href="/help" className="text-brand-700 underline">
            pide ayuda
          </Link>
          .
        </p>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {items === null && !error ? (
        <p className="text-muted flex items-center gap-2 text-sm">
          <Spinner /> Cargando…
        </p>
      ) : null}
      {items?.length === 0 ? (
        <p className="text-muted text-sm">No bloqueaste a nadie.</p>
      ) : null}
      {items && items.length > 0 ? (
        <ul className="divide-line divide-y">
          {items.map((person) => (
            <li
              key={person.userId}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-ink text-sm font-medium">{person.name}</p>
                <p className="text-muted text-xs">
                  {person.role === "mentor" ? "Mentora" : "Mentorada"}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={busyId === person.userId}
                onClick={() => void unblock(person)}
              >
                Desbloquear
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
