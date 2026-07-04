/**
 * Local JSON file-backed data store.
 *
 * Acts as a drop-in fallback when Supabase is not configured, so the admin
 * panel and public site share one persistent source of truth in development
 * with zero external setup. Data lives in `data/store.json`.
 *
 * NOTE: a file-based store is for local development only — it will not persist
 * on serverless platforms (e.g. Vercel) where the filesystem is read-only.
 * Configure Supabase for production and this layer steps aside automatically.
 */
import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seedData";

export interface DbShape {
  collections: Record<string, Record<string, any>>;
  counters: Record<string, number>;
}

const DB_PATH = path.join(process.cwd(), "data", "store.json");
let cache: DbShape | null = null;

function load(): DbShape {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as DbShape;
    cache = {
      collections: parsed.collections ?? {},
      counters: parsed.counters ?? {},
    };
  } catch {
    // First run (or unreadable file): initialize from the seed content.
    cache = buildSeed();
    persist();
  }
  return cache;
}

function persist(): void {
  if (!cache) return;
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.error("[localStore] Failed to persist data:", err);
  }
}

function col(name: string): Record<string, any> {
  const db = load();
  if (!db.collections[name]) db.collections[name] = {};
  return db.collections[name];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function nextId(collection: string): number {
  const db = load();
  const value = (db.counters[collection] ?? 0) + 1;
  db.counters[collection] = value;
  persist();
  return value;
}

export const localStore = {
  listAll(collection: string): any[] {
    return Object.values(col(collection)).map(clone);
  },

  queryEq(collection: string, field: string, value: unknown): any[] {
    return Object.values(col(collection))
      .filter((row) => row[field] === value)
      .map(clone);
  },

  getById(collection: string, id: number | string): any | null {
    const row = col(collection)[String(id)];
    return row ? clone(row) : null;
  },

  bumpCounter(collection: string, value: number): void {
    const db = load();
    if (value > (db.counters[collection] ?? 0)) {
      db.counters[collection] = value;
      persist();
    }
  },

  create(collection: string, data: any): any {
    const id = nextId(collection);
    const doc = { id, ...data, createdAt: data.createdAt ?? new Date().toISOString() };
    col(collection)[String(id)] = doc;
    persist();
    return clone(doc);
  },

  setWithId(collection: string, id: number | string, data: any): any {
    const doc = { id: typeof id === "string" ? id : Number(id), ...data };
    col(collection)[String(id)] = doc;
    persist();
    return clone(doc);
  },

  update(collection: string, id: number | string, patch: any): any | null {
    const collectionMap = col(collection);
    const existing = collectionMap[String(id)];
    if (!existing) return null;
    const merged = { ...existing, ...patch };
    collectionMap[String(id)] = merged;
    persist();
    return clone(merged);
  },

  remove(collection: string, id: number | string): void {
    delete col(collection)[String(id)];
    persist();
  },

  removeWhere(collection: string, field: string, value: unknown): void {
    const collectionMap = col(collection);
    for (const key of Object.keys(collectionMap)) {
      if (collectionMap[key][field] === value) delete collectionMap[key];
    }
    persist();
  },
};
