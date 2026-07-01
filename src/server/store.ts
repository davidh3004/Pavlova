/**
 * Generic Firestore data-access layer.
 *
 * Preserves the exact contract the frontend expects from the old Express API:
 *  - numeric, auto-incrementing IDs (via a `counters` collection + transaction)
 *  - `createdAt` stored as an ISO string
 *
 * Every helper degrades gracefully when Firebase is not configured:
 * reads return empty/null, and writes throw a clear, catchable error.
 */
import { getDb } from "./firebase";
import { localStore } from "./localStore";
import type { Firestore } from "firebase-admin/firestore";

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

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Firebase is not configured");
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

async function nextId(db: Firestore, collection: string): Promise<number> {
  const ref = db.collection(COL.counters).doc(collection);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? Number(snap.data()!.value ?? 0) : 0;
    const value = current + 1;
    tx.set(ref, { value }, { merge: true });
    return value;
  });
}

/** Ensure the counter for a collection is at least `value` (used by the seed). */
export async function bumpCounter(collection: string, value: number): Promise<void> {
  const db = getDb();
  if (!db) return localStore.bumpCounter(collection, value);
  const ref = db.collection(COL.counters).doc(collection);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? Number(snap.data()!.value ?? 0) : 0;
    if (value > current) tx.set(ref, { value }, { merge: true });
  });
}

export async function listAll(collection: string, opts?: SortOpts): Promise<Row[]> {
  const db = getDb();
  if (!db) return sortRows(localStore.listAll(collection), opts);
  const snap = await db.collection(collection).get();
  return sortRows(snap.docs.map((d) => d.data()), opts);
}

export async function queryEq(
  collection: string,
  field: string,
  value: unknown,
  opts?: SortOpts
): Promise<Row[]> {
  const db = getDb();
  if (!db) return sortRows(localStore.queryEq(collection, field, value), opts);
  const snap = await db.collection(collection).where(field, "==", value).get();
  return sortRows(snap.docs.map((d) => d.data()), opts);
}

export async function getById(collection: string, id: number | string): Promise<Row | null> {
  const db = getDb();
  if (!db) return localStore.getById(collection, id);
  const snap = await db.collection(collection).doc(String(id)).get();
  return snap.exists ? (snap.data() as Row) : null;
}

export async function create(collection: string, data: Row): Promise<Row> {
  const db = getDb();
  if (!db) return localStore.create(collection, data);
  const id = await nextId(db, collection);
  const doc: Row = {
    id,
    ...data,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
  await db.collection(collection).doc(String(id)).set(doc);
  return doc;
}

/** Create a document at a specific id (used by the seed importer). */
export async function setWithId(collection: string, id: number | string, data: Row): Promise<Row> {
  const db = getDb();
  if (!db) return localStore.setWithId(collection, id, data);
  const doc: Row = { id: typeof id === "string" ? id : Number(id), ...data };
  await db.collection(collection).doc(String(id)).set(doc);
  return doc;
}

export async function update(
  collection: string,
  id: number | string,
  patch: Row
): Promise<Row | null> {
  const db = getDb();
  if (!db) return localStore.update(collection, id, patch);
  const ref = db.collection(collection).doc(String(id));
  const existing = await ref.get();
  if (!existing.exists) return null;
  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  return snap.data() as Row;
}

export async function remove(collection: string, id: number | string): Promise<void> {
  const db = getDb();
  if (!db) return localStore.remove(collection, id);
  await db.collection(collection).doc(String(id)).delete();
}

export async function removeWhere(collection: string, field: string, value: unknown): Promise<void> {
  const db = getDb();
  if (!db) return localStore.removeWhere(collection, field, value);
  const snap = await db.collection(collection).where(field, "==", value).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
