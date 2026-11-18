import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/lib/call/use-call";
import { CallChat } from "./call-chat";

const messages: ChatMessage[] = [
  { id: "1", from: "peer", text: "Hola, ¿me escuchas?", sentAt: 0 },
  { id: "2", from: "me", text: "Sí, perfecto", sentAt: 0 },
];

describe("CallChat", () => {
  it("shows both sides of the conversation", () => {
    render(
      <CallChat
        messages={messages}
        ready
        peerName="Lucía"
        onSend={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Hola, ¿me escuchas?")).toBeTruthy();
    expect(screen.getByText("Sí, perfecto")).toBeTruthy();
    expect(screen.getByText(/no se guarda/)).toBeTruthy();
  });

  it("sends with Enter and clears the box; Shift+Enter does not send", () => {
    const onSend = vi.fn().mockReturnValue(true);
    render(
      <CallChat
        messages={[]}
        ready
        peerName="Lucía"
        onSend={onSend}
        onClose={vi.fn()}
      />,
    );
    const box = screen.getByLabelText("Mensaje") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "https://ejemplo.org" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("https://ejemplo.org");
    expect(box.value).toBe("");
  });

  it("cannot send until the other person is connected", () => {
    render(
      <CallChat
        messages={[]}
        ready={false}
        peerName="Lucía"
        onSend={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByPlaceholderText("Esperando a Lucía…")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Enviar" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
