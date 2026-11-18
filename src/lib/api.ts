/**
 * The one place the storefront talks to the Playweary API (NestJS).
 *
 * `NEXT_PUBLIC_API_URL` is public on purpose: checkout and tracking call the
 * API straight from the browser, so rate limits see the shopper's real IP.
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FRIENDLY: Record<number, string> = {
  404: "We could not find that.",
  409: "Something in your cart just sold out. Please review your cart.",
  422: "This order was already placed with different details. Please refresh and try again.",
  429: "Too many attempts. Please wait a few minutes and try again.",
};

type ApiInit = Omit<RequestInit, "body"> & { body?: unknown; timeoutMs?: number };

export async function api<T>(path: string, { body, timeoutMs = 10_000, headers, ...init }: ApiInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError("The store is not connected yet. Please try again later.", 0);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError("We couldn't reach the store. Check your connection and try again.", 0);
  }
  if (res.ok) return (await res.json()) as T;

  let message = FRIENDLY[res.status] ?? "Something went wrong on our side. Please try again.";
  let details: string[] = [];
  try {
    const err = (await res.json()) as { message?: string | string[] };
    const raw = Array.isArray(err.message) ? err.message : err.message ? [err.message] : [];
    // Nest prefixes nested field messages with their path ("address.Enter a city.").
    details = raw.map((m) => m.replace(/^[\w.[\]]+\.(?=[A-Z])/, ""));
    // Show the server's own wording for validation, sold-out and per-email limits, but not
    // the framework's generic throttle text ("ThrottlerException: Too Many Requests").
    const own = details[0] && !/^ThrottlerException/i.test(details[0]) ? details[0] : undefined;
    if (res.status === 400 || res.status === 409 || res.status === 429) message = own ?? message;
  } catch {
    /* not JSON */
  }
  throw new ApiError(message, res.status, details);
}

export const cents = (c: number) => c / 100;
