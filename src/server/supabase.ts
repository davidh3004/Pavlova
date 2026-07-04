/**
 * Supabase client (service role) for server-side data access.
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * If credentials are missing, getSupabase() returns null and the API layer
 * falls back to the local JSON store (data/store.json) for development.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

function isPlaceholder(value?: string): boolean {
  if (!value) return true;
  return /your-project|your-supabase|eyJhbGciOi\.\.\.|example\.supabase/i.test(value);
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !isPlaceholder(url) && !isPlaceholder(key);
}

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  if (!isSupabaseConfigured()) {
    console.warn(
      "[Supabase] Credentials not set or still using placeholders. Falling back to the local JSON store (data/store.json) for development."
    );
    cached = null;
    return cached;
  }

  try {
    cached = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return cached;
  } catch (err) {
    console.error("[Supabase] Failed to initialize:", err);
    cached = null;
    return cached;
  }
}
