import { afterEach, describe, expect, it, vi } from "vitest";
import {
  approveMentor,
  getAdminMentor,
  listAdminMentors,
  reactivateMentor,
  rejectMentor,
  suspendMentor,
} from "./admin-mentors";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin mentors API", () => {
  it("lists mentors with status and cursor filters", async () => {
    const body = { items: [], nextCursor: null };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listAdminMentors({
        status: "pending_review",
        limit: 20,
        cursor: "mentor-1",
      }),
    ).resolves.toEqual(body);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(
      /\/admin\/mentors\?status=pending_review&limit=20&cursor=mentor-1$/,
    );
    expect(init).toMatchObject({
      credentials: "include",
      cache: "no-store",
    });
  });

  it("loads a mentor detail by encoded id", async () => {
    const body = { mentor: { userId: "mentor-1" }, onboarding: {} };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({ body }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAdminMentor("mentor/1")).resolves.toEqual(body);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/admin\/mentors\/mentor%2F1$/);
  });

  it("approves a mentor with POST and no body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { profile: {} } }));
    vi.stubGlobal("fetch", fetchMock);

    await approveMentor("mentor-1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/admin\/mentors\/mentor-1\/approve$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("rejects a mentor with a reason", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { profile: {} } }));
    vi.stubGlobal("fetch", fetchMock);

    await rejectMentor("mentor-1", "Falta detalle");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toMatch(/\/admin\/mentors\/mentor-1\/reject$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      reason: "Falta detalle",
    });
  });

  it("suspends and reactivates a mentor with POST", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse({ body: { profile: {} } }));
    vi.stubGlobal("fetch", fetchMock);

    await suspendMentor("mentor-1");
    await reactivateMentor("mentor-1");

    const [suspendUrl, suspendInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const [reactivateUrl, reactivateInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];

    expect(suspendUrl).toMatch(/\/admin\/mentors\/mentor-1\/suspend$/);
    expect(suspendInit.method).toBe("POST");
    expect(reactivateUrl).toMatch(/\/admin\/mentors\/mentor-1\/reactivate$/);
    expect(reactivateInit.method).toBe("POST");
  });
});
