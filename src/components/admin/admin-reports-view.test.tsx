import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportDetail, ReportSummary } from "@/lib/api/admin-reports";
import { AdminReportsView } from "./admin-reports-view";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  listReports: vi.fn(),
  getReport: vi.fn(),
  resolveReport: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@example.com", role: "admin" },
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/api/admin-reports", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/admin-reports")>()),
  listReports: mocks.listReports,
  getReport: mocks.getReport,
  resolveReport: mocks.resolveReport,
}));

const summary: ReportSummary = {
  id: "report-1",
  reason: "harassment",
  status: "open",
  createdAt: "2026-11-10T15:00:00.000Z",
  bookingId: "booking-1",
  reporter: {
    id: "mentee-1",
    name: "Rosa Quispe",
    role: "mentee",
    status: "active",
  },
  reportedUser: {
    id: "mentor-1",
    name: "Laura Díaz",
    role: "mentor",
    status: "active",
  },
};

const detail: ReportDetail = {
  id: "report-1",
  reason: "harassment",
  details: "Me escribió fuera de la plataforma varias veces.",
  status: "open",
  action: null,
  resolutionNote: null,
  createdAt: summary.createdAt,
  resolvedAt: null,
  resolvedBy: null,
  reporter: summary.reporter,
  reportedUser: { ...summary.reportedUser, reportsTotal: 3, reportsOpen: 2 },
  booking: {
    id: "booking-1",
    status: "completed",
    offeringTitle: "Primera conversación",
    startsAt: "2026-11-08T15:00:00.000Z",
  },
};

beforeEach(() => {
  mocks.refresh.mockReset();
  mocks.listReports
    .mockReset()
    .mockResolvedValue({ items: [summary], nextCursor: null });
  mocks.getReport.mockReset().mockResolvedValue(detail);
  mocks.resolveReport.mockReset().mockResolvedValue({
    ...detail,
    status: "resolved",
    action: "suspended",
  });
});

async function openReport() {
  render(<AdminReportsView />);
  fireEvent.click(
    await screen.findByRole("button", { name: /Sobre Laura Díaz/ }),
  );
  await screen.findByText("Me escribió fuera de la plataforma varias veces.");
}

describe("AdminReportsView", () => {
  it("loads the open queue and shows the report detail with context", async () => {
    await openReport();

    expect(mocks.listReports).toHaveBeenCalledWith(
      { status: "open" },
      expect.any(AbortSignal),
    );
    expect(
      screen.getByText("3 reportes en total, 2 abiertos."),
    ).toBeInTheDocument();
    expect(screen.getByText("Primera conversación")).toBeInTheDocument();
  });

  it("requires an action and a note before resolving", async () => {
    await openReport();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Elige una acción.")).toBeInTheDocument();
    expect(screen.getByText("Este campo es obligatorio.")).toBeInTheDocument();
    expect(mocks.resolveReport).not.toHaveBeenCalled();
  });

  it("explains the effects of suspending and resolves after confirming", async () => {
    await openReport();

    fireEvent.click(screen.getByRole("radio", { name: /Suspender cuenta/ }));
    fireEvent.change(screen.getByLabelText("Nota interna"), {
      target: { value: "  Tres reportes de acoso confirmados  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      screen.getByText("¿Suspender la cuenta de Laura Díaz?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Se cancelarán todas sus reservas abiertas/),
    ).toBeInTheDocument();
    expect(mocks.resolveReport).not.toHaveBeenCalled();

    mocks.getReport.mockResolvedValue({
      ...detail,
      status: "resolved",
      action: "suspended",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Sí, suspender cuenta" }),
    );

    await waitFor(() => {
      expect(mocks.resolveReport).toHaveBeenCalledWith("report-1", {
        action: "suspend",
        note: "Tres reportes de acoso confirmados",
      });
    });
    expect(
      await screen.findByText(/La cuenta quedó suspendida/),
    ).toBeInTheDocument();
    expect(mocks.listReports).toHaveBeenCalledTimes(2);
  });

  it("shows the API message when another moderator closed the report", async () => {
    const { ApiError } = await import("@/lib/api/client");
    mocks.resolveReport.mockRejectedValue(
      new ApiError(409, "REPORT_ALREADY_CLOSED", "closed"),
    );
    await openReport();

    fireEvent.click(screen.getByRole("radio", { name: /Descartar/ }));
    fireEvent.change(screen.getByLabelText("Nota interna"), {
      target: { value: "Sin evidencia" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, descartar" }));

    expect(
      await screen.findByText(
        "Otra persona ya cerró este reporte. Recarga la bandeja.",
      ),
    ).toBeInTheDocument();
  });

  it("switches tabs to the dismissed queue", async () => {
    render(<AdminReportsView />);
    await screen.findByRole("button", { name: /Sobre Laura Díaz/ });

    fireEvent.click(screen.getByRole("tab", { name: "Descartados" }));

    await waitFor(() => {
      expect(mocks.listReports).toHaveBeenLastCalledWith(
        { status: "dismissed" },
        expect.any(AbortSignal),
      );
    });
  });
});
