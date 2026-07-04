/**
 * Admin authentication.
 *
 * Replaces express-session with a stateless, signed HMAC cookie so the app
 * needs no server-side session store and runs anywhere.
 *
 * Env:
 *   SESSION_SECRET   - HMAC signing secret (falls back to a dev default)
 *   ADMIN_USERNAME   - default admin username  (default: "admin")
 *   ADMIN_PASSWORD   - default admin password  (default: "pavlovalove2024")
 */
import crypto from "node:crypto";
import type { AstroCookies } from "astro";
import { COL, getById, queryEq } from "./store";
import { isSupabaseConfigured } from "./supabase";

const PASSWORD_SALT = "pavlova_salt_2024";
export const ADMIN_COOKIE = "pavlova_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
  passwordHash: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + PASSWORD_SALT).digest("hex");
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET || "pavlova-dev-secret-change-me";
}

function defaultAdmin(): AdminUser {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "pavlovalove2024";
  return { id: 1, username, name: "Administrator", role: "admin", passwordHash: hashPassword(password) };
}

export function signSession(uid: number): string {
  const payload = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token?: string | null): number | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: number; exp: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: AstroCookies, uid: number): void {
  cookies.set(ADMIN_COOKIE, signSession(uid), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(ADMIN_COOKIE, { path: "/" });
}

export function getAdminId(cookies: AstroCookies): number | null {
  return verifySession(cookies.get(ADMIN_COOKIE)?.value);
}

export async function findAdminByUsername(username: string): Promise<AdminUser | null> {
  if (isSupabaseConfigured()) {
    try {
      const rows = await queryEq(COL.adminUsers, "username", username);
      if (rows[0]) return rows[0] as AdminUser;
    } catch (err) {
      console.warn("[auth] Admin lookup failed, using default admin:", (err as Error)?.message);
    }
  }
  const def = defaultAdmin();
  return username === def.username ? def : null;
}

export async function findAdminById(id: number): Promise<AdminUser | null> {
  if (isSupabaseConfigured()) {
    try {
      const row = await getById(COL.adminUsers, id);
      if (row) return row as AdminUser;
    } catch (err) {
      console.warn("[auth] Admin lookup failed, using default admin:", (err as Error)?.message);
    }
  }
  const def = defaultAdmin();
  return id === def.id ? def : null;
}

export function publicAdmin(user: AdminUser) {
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}
