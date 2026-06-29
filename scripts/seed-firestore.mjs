/**
 * Seed Firestore with the bakery's data (categories, products, menus, reviews,
 * site settings) exported from the previous database.
 *
 * Usage:
 *   1. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
 *      in a .env file (see .env.example) or in your shell environment.
 *   2. Run:  node scripts/seed-firestore.mjs
 *
 * Safe to re-run: documents are written by their numeric id, so re-seeding
 * overwrites the same records instead of creating duplicates.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "\n[seed] Missing Firebase credentials.\n" +
      "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY first " +
      "(see .env.example).\n"
  );
  process.exit(1);
}
if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);

const data = JSON.parse(readFileSync(resolve(__dirname, "seed-data.json"), "utf8"));

// seed-data.json key -> Firestore collection name (must match src/server/store.ts COL)
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
  // Firestore batches are limited to 500 operations.
  for (let i = 0; i < rows.length; i += 400) {
    const batch = db.batch();
    for (const row of rows.slice(i, i + 400)) {
      const id = Number(row.id);
      if (id > maxId) maxId = id;
      batch.set(db.collection(collection).doc(String(id)), row);
    }
    await batch.commit();
  }
  // Advance the auto-increment counter so new records get fresh ids.
  await db.collection("counters").doc(collection).set({ value: maxId }, { merge: true });
  console.log(`[seed] ${collection}: imported ${rows.length} (counter -> ${maxId})`);
}

console.log(`[seed] Seeding Firestore for project "${projectId}"...`);
for (const [key, collection] of Object.entries(COLLECTIONS)) {
  await seedCollection(key, collection);
}
console.log("[seed] Done.");
process.exit(0);
