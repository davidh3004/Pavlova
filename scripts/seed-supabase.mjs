/**
 * Seed Supabase with the bakery's data (categories, products, menus, reviews,
 * site settings) from scripts/seed-data.json.
 *
 * Usage:
 *   1. Run scripts/supabase-schema.sql in the Supabase SQL Editor.
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 *   3. Run:  npm run seed
 *
 * Safe to re-run: documents are upserted by id.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || /your-project|your-supabase|example\.supabase/i.test(url)) {
  console.error(
    "\n[seed] Missing Supabase credentials.\n" +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first (see .env.example).\n"
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const data = JSON.parse(readFileSync(resolve(__dirname, "seed-data.json"), "utf8"));

// seed-data.json key -> collection name (must match src/server/store.ts COL)
const COLLECTIONS = {
  categories: "categories",
  products: "products",
  menus: "menus",
  menu_sections: "menu_sections",
  menu_items: "menu_items",
  reviews: "reviews",
  site_settings: "site_settings",
};

async function seedCollection(key, collection) {
  const rows = data[key] ?? [];
  if (rows.length === 0) {
    console.log(`[seed] ${collection}: nothing to import`);
    return;
  }

  let maxId = 0;
  const payload = rows.map((row) => {
    const id = Number(row.id);
    if (id > maxId) maxId = id;
    return {
      collection,
      doc_id: String(id),
      data: row,
    };
  });

  for (let i = 0; i < payload.length; i += 200) {
    const chunk = payload.slice(i, i + 200);
    const { error } = await db.from("app_documents").upsert(chunk);
    if (error) {
      console.error(`[seed] ${collection} failed:`, error.message);
      process.exit(1);
    }
  }

  const { error: counterError } = await db.rpc("bump_app_counter", {
    coll: collection,
    min_value: maxId,
  });
  if (counterError) {
    console.error(`[seed] ${collection} counter failed:`, counterError.message);
    process.exit(1);
  }

  console.log(`[seed] ${collection}: imported ${rows.length} (counter -> ${maxId})`);
}

console.log(`[seed] Seeding Supabase at ${url}...`);
for (const [key, collection] of Object.entries(COLLECTIONS)) {
  await seedCollection(key, collection);
}
console.log("[seed] Done.");
