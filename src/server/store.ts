/**
 * Generic data-access layer (Supabase-backed).
 *
 * Preserves the exact contract the frontend expects:
 *  - numeric, auto-incrementing IDs (via app_counters + RPC)
 *  - `createdAt` stored as an ISO string
 *
 * Every helper degrades gracefully when Supabase is not configured:
 * reads return empty/null, and writes use the local JSON store.
 */
import { getSupabase } from "./supabase";
import { localStore } from "./localStore";

export const COL = {
  categories: "categories",
  products: "products",
  menus: "menus",
  menuSections: "menu_sections",
  menuItems: "menu_items",
  orders: "orders",
  orderItems: "order_items",
  cateringInquiries: "catering_inquiries",
  customOrders: "custom_orders",
  contactMessages: "contact_messages",
  reviews: "reviews",
  gallery: "gallery_items",
  promotions: "promotions",
  settings: "site_settings",
  adminUsers: "admin_users",
  counters: "counters",
} as const;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("Database is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

/** @deprecated Use DatabaseNotConfiguredError */
export class FirebaseNotConfiguredError extends DatabaseNotConfiguredError {
  constructor() {
    super();
    this.name = "FirebaseNotConfiguredError";
  }
}

type Row = Record<string, any>;
interface SortOpts {
  orderBy?: string;
  dir?: "asc" | "desc";
}

function sortRows(rows: Row[], opts?: SortOpts): Row[] {
  if (!opts?.orderBy) return rows;
  const field = opts.orderBy;
  const factor = opts.dir === "desc" ? -1 : 1;
  return rows.sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (av > bv ? 1 : -1) * factor;
  });
}

function rowFrom(data: unknown): Row {
  return (data ?? {}) as Row;
}

async function nextId(collection: string): Promise<number> {
  const db = getSupabase()!;
  const { data, error } = await db.rpc("next_app_counter", { coll: collection });
  if (error) throw error;
  return Number(data);
}

/** Ensure the counter for a collection is at least `value` (used by the seed). */
export async function bumpCounter(collection: string, value: number): Promise<void> {
  const db = getSupabase();
  if (!db) return localStore.bumpCounter(collection, value);
  const { error } = await db.rpc("bump_app_counter", { coll: collection, min_value: value });
  if (error) throw error;
}

export async function listAll(collection: string, opts?: SortOpts): Promise<Row[]> {
  const db = getSupabase();
  if (!db) return sortRows(localStore.listAll(collection), opts);
  const { data, error } = await db
    .from("app_documents")
    .select("data")
    .eq("collection", collection);
  if (error) throw error;
  return sortRows((data ?? []).map((r) => rowFrom(r.data)), opts);
}

export async function queryEq(
  collection: string,
  field: string,
  value: unknown,
  opts?: SortOpts
): Promise<Row[]> {
  const db = getSupabase();
  if (!db) return sortRows(localStore.queryEq(collection, field, value), opts);
  const { data, error } = await db
    .from("app_documents")
    .select("data")
    .eq("collection", collection)
    .contains("data", { [field]: value });
  if (error) throw error;
  return sortRows((data ?? []).map((r) => rowFrom(r.data)), opts);
}

export async function getById(collection: string, id: number | string): Promise<Row | null> {
  const db = getSupabase();
  if (!db) return localStore.getById(collection, id);
  const { data, error } = await db
    .from("app_documents")
    .select("data")
    .eq("collection", collection)
    .eq("doc_id", String(id))
    .maybeSingle();
  if (error) throw error;
  return data ? rowFrom(data.data) : null;
}

export async function create(collection: string, data: Row): Promise<Row> {
  const db = getSupabase();
  if (!db) return localStore.create(collection, data);
  const id = await nextId(collection);
  const doc: Row = {
    id,
    ...data,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
  const { error } = await db.from("app_documents").insert({
    collection,
    doc_id: String(id),
    data: doc,
  });
  if (error) throw error;
  return doc;
}

/** Create a document at a specific id (used by the seed importer). */
export async function setWithId(collection: string, id: number | string, data: Row): Promise<Row> {
  const db = getSupabase();
  if (!db) return localStore.setWithId(collection, id, data);
  const doc: Row = { id: typeof id === "string" ? id : Number(id), ...data };
  const { error } = await db.from("app_documents").upsert({
    collection,
    doc_id: String(id),
    data: doc,
  });
  if (error) throw error;
  return doc;
}

export async function update(
  collection: string,
  id: number | string,
  patch: Row
): Promise<Row | null> {
  const db = getSupabase();
  if (!db) return localStore.update(collection, id, patch);
  const existing = await getById(collection, id);
  if (!existing) return null;
  const doc = { ...existing, ...patch };
  const { error } = await db
    .from("app_documents")
    .update({ data: doc })
    .eq("collection", collection)
    .eq("doc_id", String(id));
  if (error) throw error;
  return doc;
}

export async function remove(collection: string, id: number | string): Promise<void> {
  const db = getSupabase();
  if (!db) return localStore.remove(collection, id);
  const { error } = await db
    .from("app_documents")
    .delete()
    .eq("collection", collection)
    .eq("doc_id", String(id));
  if (error) throw error;
}

export async function removeWhere(collection: string, field: string, value: unknown): Promise<void> {
  const db = getSupabase();
  if (!db) return localStore.removeWhere(collection, field, value);
  const rows = await queryEq(collection, field, value);
  if (rows.length === 0) return;
  const ids = rows.map((r) => String(r.id));
  const { error } = await db
    .from("app_documents")
    .delete()
    .eq("collection", collection)
    .in("doc_id", ids);
  if (error) throw error;
}
