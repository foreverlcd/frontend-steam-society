import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getReport,
  listReports,
  reactivateUser,
  resolveReport,
  suspendUser,
} from "./admin-reports";

function mockResponse({
  body,
  status = 200,
}: {
  body?: unknown;
  status?: number;
}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  } as Response;
}

function stubFetch(body: unknown = {}, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body, status }));
  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.at(-1) as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin reports API", () => {
  it("lists reports by status and cursor", async () => {
    const body = { items: [], nextCursor: null };
    const fetchMock = stubFetch(body);

    await expect(
      listReports({ status: "dismissed", limit: 10, cursor: "report-1" }),
    ).resolves.toEqual(body);

    const [url, init] = lastCall(fetchMock);
    expect(url).toMatch(
      /\/admin\/reports\?status=dismissed&limit=10&cursor=report-1$/,
    );
    expect(init).toMatchObject({ credentials: "include" });
  });

  it("loads a report detail by encoded id", async () => {
    const fetchMock = stubFetch({ id: "report/1" });

    await getReport("report/1");

    const [url] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/reports\/report%2F1$/);
  });

  it("resolves a report with an action and a note", async () => {
    const fetchMock = stubFetch({ id: "report-1", status: "resolved" });

    await resolveReport("report-1", { action: "warn", note: "Primer aviso" });

    const [url, init] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/reports\/report-1\/resolve$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      action: "warn",
      note: "Primer aviso",
    });
  });

  it("surfaces REPORT_ALREADY_CLOSED as an ApiError", async () => {
    stubFetch(
      { statusCode: 409, code: "REPORT_ALREADY_CLOSED", message: "closed" },
      409,
    );

    await expect(
      resolveReport("report-1", { action: "dismiss", note: "ok" }),
    ).rejects.toMatchObject({ status: 409, code: "REPORT_ALREADY_CLOSED" });
  });

  it("suspends a user with a reason", async () => {
    const fetchMock = stubFetch({
      userId: "user-1",
      status: "suspended",
      cancelledBookings: 2,
    });

    await expect(suspendUser("user-1", "Acoso reiterado")).resolves.toEqual({
      userId: "user-1",
      status: "suspended",
      cancelledBookings: 2,
    });

    const [url, init] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/users\/user-1\/suspend$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      reason: "Acoso reiterado",
    });
  });

  it("reactivates a user with POST and no body", async () => {
    const fetchMock = stubFetch({ userId: "user-1", status: "active" });

    await reactivateUser("user-1");

    const [url, init] = lastCall(fetchMock);
    expect(url).toMatch(/\/admin\/users\/user-1\/reactivate$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });
});
