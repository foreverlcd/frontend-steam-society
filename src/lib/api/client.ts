const DEFAULT_API_URL = "http://localhost:3000/v1";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, "");

export interface ApiRequestOptions extends Omit<
  RequestInit,
  "body" | "credentials" | "headers"
> {
  json?: unknown;
  headers?: HeadersInit;
}

interface ErrorBody {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  error?: string;
  details?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBody(text: string): unknown {
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static fromResponse(status: number, payload: unknown): ApiError {
    const body = isRecord(payload) ? (payload as ErrorBody) : undefined;
    const code = typeof body?.code === "string" ? body.code : `HTTP_${status}`;
    const rawMessage = body?.message;

    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : typeof rawMessage === "string"
        ? rawMessage
        : typeof body?.error === "string"
          ? body.error
          : `La solicitud falló (${status})`;

    return new ApiError(status, code, message, body?.details);
  }

  static network(error: unknown): ApiError {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo conectar con el servidor";

    return new ApiError(0, "NETWORK_ERROR", message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { json, headers: customHeaders, ...requestOptions } = options;
  const headers = new Headers(customHeaders);
  headers.set("Accept", "application/json");

  let body: string | undefined;

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      body,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw ApiError.network(error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = parseBody(await response.text());

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, payload);
  }

  return payload as T;
}
