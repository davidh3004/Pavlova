/** Small helpers for Astro API route responses. */

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export async function readBody<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function toNumber(value: unknown, fallback = NaN): number {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

/** Wraps a handler, mapping store errors to clean HTTP responses. */
export async function run(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e: any) {
    if (e?.name === "FirebaseNotConfiguredError") {
      return json({ error: "Database not configured" }, 503);
    }
    console.error("[API] Unhandled error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
}
