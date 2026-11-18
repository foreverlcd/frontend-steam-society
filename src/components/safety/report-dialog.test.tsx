import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportDialog } from "./report-dialog";

const mocks = vi.hoisted(() => ({
  createReport: vi.fn(),
  blockUser: vi.fn(),
}));

vi.mock("@/lib/api/safety", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/safety")>()),
  createReport: mocks.createReport,
  blockUser: mocks.blockUser,
}));

const person = { id: "user-2", name: "Ana Pérez" };

describe("ReportDialog", () => {
  beforeEach(() => {
    mocks.createReport
      .mockReset()
      .mockResolvedValue({ id: "r1", status: "open" });
    mocks.blockUser
      .mockReset()
      .mockResolvedValue({ blockedUserId: "user-2", cancelledBookings: 1 });
  });

  it("asks for a reason before sending a report", async () => {
    render(<ReportDialog person={person} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));
    expect(await screen.findByText("Elige un motivo.")).toBeTruthy();
    expect(mocks.createReport).not.toHaveBeenCalled();
  });

  it("reports and blocks by default, then reloads", async () => {
    const onBlocked = vi.fn();
    render(
      <ReportDialog
        person={person}
        bookingId="booking-1"
        onClose={vi.fn()}
        onBlocked={onBlocked}
      />,
    );
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  Detalle  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));

    await waitFor(() => expect(onBlocked).toHaveBeenCalledWith(1));
    expect(mocks.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportedUserId: "user-2",
        bookingId: "booking-1",
        details: "Detalle",
      }),
    );
    expect(mocks.blockUser).toHaveBeenCalledWith("user-2");
    expect(screen.getByText(/cancelamos la reserva abierta/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Más ayuda" })).toBeTruthy();
  });

  it("can block without reporting", async () => {
    render(<ReportDialog person={person} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Solo bloquear" }));
    await screen.findByText(/Bloqueaste a Ana Pérez/);
    expect(mocks.createReport).not.toHaveBeenCalled();
  });

  it("reports without blocking when unchecked", async () => {
    render(<ReportDialog person={person} onClose={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("radio")[1]);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar reporte" }));
    await screen.findByText(/revisará tu reporte/);
    expect(mocks.blockUser).not.toHaveBeenCalled();
  });
});
