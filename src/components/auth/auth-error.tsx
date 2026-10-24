"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FullPageStatus } from "./full-page-status";

export function AuthError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => Promise<void>;
}) {
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);

    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <FullPageStatus loading={false} message="No pudimos comprobar tu sesión.">
      <div className="w-full max-w-sm space-y-4">
        <Alert tone="error">
          {message ?? "Inténtalo de nuevo en unos segundos."}
        </Alert>
        <Button
          className="w-full"
          loading={retrying}
          onClick={() => void handleRetry()}
        >
          Reintentar
        </Button>
      </div>
    </FullPageStatus>
  );
}
