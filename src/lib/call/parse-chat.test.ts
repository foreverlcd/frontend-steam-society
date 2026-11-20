import { describe, expect, it } from "vitest";
import {
  CHAT_HISTORY_LIMIT,
  CHAT_MAX_LENGTH,
  appendChat,
  parseChat,
  type ChatMessage,
} from "./use-call";

describe("parseChat", () => {
  it("accepts a text message from the peer", () => {
    expect(
      parseChat(JSON.stringify({ text: "  hola  ", sentAt: 1 })),
    ).toMatchObject({ from: "peer", text: "hola" });
  });

  it("drops anything that is not a non-empty text message", () => {
    expect(parseChat("not json")).toBeNull();
    expect(parseChat(JSON.stringify({ text: 42 }))).toBeNull();
    expect(parseChat(JSON.stringify({ text: "   " }))).toBeNull();
    expect(parseChat(new ArrayBuffer(4))).toBeNull();
    expect(parseChat("x".repeat(CHAT_MAX_LENGTH * 4 + 1))).toBeNull();
  });

  it("cuts long messages to the limit", () => {
    const text = "a".repeat(CHAT_MAX_LENGTH + 50);
    expect(parseChat(JSON.stringify({ text }))?.text).toHaveLength(
      CHAT_MAX_LENGTH,
    );
  });
});

describe("appendChat", () => {
  it("keeps only the latest messages", () => {
    const message = (n: number): ChatMessage => ({
      id: String(n),
      from: "peer",
      text: `m${n}`,
      sentAt: n,
    });
    let list: ChatMessage[] = [];
    for (let n = 0; n < CHAT_HISTORY_LIMIT + 5; n += 1) {
      list = appendChat(list, message(n));
    }
    expect(list).toHaveLength(CHAT_HISTORY_LIMIT);
    expect(list[0]?.id).toBe("5");
  });
});
