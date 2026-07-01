/**
 * Square SDK access (server-side only). All secret keys stay on the server.
 *
 * Env:
 *   SQUARE_ACCESS_TOKEN   - access token (payments unavailable if unset)
 *   SQUARE_APPLICATION_ID - used by the Web Payments SDK on the client
 *   SQUARE_LOCATION_ID    - Square location id
 *   SQUARE_ENVIRONMENT    - "sandbox" | "production" (default: sandbox)
 */
import { SquareClient, SquareEnvironment } from "square";

/** Read env at request time — bracket access avoids Vite inlining empty values at build on Vercel. */
function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function getSquarePublicConfig() {
  const applicationId = env("SQUARE_APPLICATION_ID");
  const locationId = env("SQUARE_LOCATION_ID");
  const environment = env("SQUARE_ENVIRONMENT", "sandbox");
  return {
    applicationId,
    locationId,
    environment,
    configured: Boolean(applicationId && locationId),
  };
}

export function getSquareLocationId(): string {
  return env("SQUARE_LOCATION_ID");
}

export function isSquareConfigured(): boolean {
  return Boolean(
    env("SQUARE_ACCESS_TOKEN") && env("SQUARE_APPLICATION_ID") && env("SQUARE_LOCATION_ID")
  );
}

let cached: SquareClient | null | undefined;

export function getSquareClient(): SquareClient | null {
  if (cached !== undefined) return cached;
  const token = env("SQUARE_ACCESS_TOKEN");
  if (!token) {
    cached = null;
    return cached;
  }
  cached = new SquareClient({
    token,
    environment:
      env("SQUARE_ENVIRONMENT", "sandbox") === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
  return cached;
}

/** Convert a decimal dollar amount to Square money cents, e.g. 12.5 -> 1250 */
export function decimalToSquareMoney(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}
