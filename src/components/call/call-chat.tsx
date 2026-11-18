"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CHAT_MAX_LENGTH, type ChatMessage } from "@/lib/call/use-call";
import { cn } from "@/lib/cn";

const timeFormat = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
});

interface CallChatProps {
  messages: ChatMessage[];
  /** The peer-to-peer channel is open, so messages can be sent. */
  ready: boolean;
  peerName: string;
  onSend: (text: string) => boolean;
  onClose: () => void;
  className?: string;
}

/** Text chat during the call. Nothing is stored: it ends with the call. */
export function CallChat({
  messages,
  ready,
  peerName,
  onSend,
  onClose,
  className,
}: CallChatProps) {
  const titleId = useId();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (onSend(draft)) setDraft("");
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "text-ink flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl",
        className,
      )}
    >
      <header className="border-line flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 id={titleId} className="text-sm font-semibold">
            Chat
          </h2>
          <p className="text-muted text-xs">
            Solo durante la llamada; no se guarda.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          className="text-muted hover:text-ink focus-visible:ring-brand-500 grid size-8 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <ol
        ref={listRef}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 ? (
          <li className="text-muted py-6 text-center text-sm">
            Escribe un mensaje a {peerName}: un enlace, un dato o una duda.
          </li>
        ) : null}
        {messages.map((message) => {
          const mine = message.from === "me";
          return (
            <li
              key={message.id}
              className={cn(
                "flex flex-col",
                mine ? "items-end" : "items-start",
              )}
            >
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                  mine
                    ? "bg-brand-600 rounded-br-sm text-white"
                    : "bg-canvas border-line rounded-bl-sm border",
                )}
              >
                {message.text}
              </p>
              <span className="text-muted mt-1 text-[11px]">
                {mine ? "Tú" : peerName} ·{" "}
                {timeFormat.format(new Date(message.sentAt))}
              </span>
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className="border-line border-t p-3">
        <label htmlFor={`${titleId}-input`} className="sr-only">
          Mensaje
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={`${titleId}-input`}
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={CHAT_MAX_LENGTH}
            disabled={!ready}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={
              ready ? "Escribe un mensaje" : `Esperando a ${peerName}…`
            }
            className="border-line focus-visible:ring-brand-500 max-h-28 min-h-10 flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!ready || !draft.trim()}
            className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500 rounded-xl px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </section>
  );
}
