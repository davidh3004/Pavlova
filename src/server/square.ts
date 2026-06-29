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

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID ?? "";
export const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID ?? "";
export const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT ?? "sandbox";

export function isSquareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && SQUARE_APPLICATION_ID && SQUARE_LOCATION_ID);
}

let cached: SquareClient | null | undefined;

export function getSquareClient(): SquareClient | null {
  if (cached !== undefined) return cached;
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    cached = null;
    return cached;
  }
  cached = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment:
      SQUARE_ENVIRONMENT === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  });
  return cached;
}

/** Convert a decimal dollar amount to Square money cents, e.g. 12.5 -> 1250 */
export function decimalToSquareMoney(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}
