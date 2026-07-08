/**
 * Match website products to Square catalog variation IDs by name.
 *
 * Requires SQUARE_ACCESS_TOKEN, SQUARE_ENVIRONMENT in .env
 * Run: node scripts/sync-square-variation-ids.mjs
 *
 * After running, re-seed or update products in Supabase so squareVariationId is stored.
 */
import "dotenv/config";
import { SquareClient, SquareEnvironment } from "square";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "seed-data.json");

const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) {
  console.error("Set SQUARE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const strip = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

async function listAllVariations() {
  const variations = [];
  let cursor;
  do {
    const res = await client.catalog.list({ types: "ITEM", cursor });
    for (const obj of res.data ?? []) {
      if (obj.type !== "ITEM" || !obj.itemData) continue;
      const itemName = obj.itemData.name ?? "";
      for (const v of obj.itemData.variations ?? []) {
        const vName = v.itemVariationData?.name ?? "";
        const label =
          vName && strip(vName) !== "sin variacion" && strip(vName) !== "regular"
            ? `${itemName} — ${vName}`
            : itemName;
        if (v.id) variations.push({ id: v.id, label: strip(label) });
      }
    }
    cursor = res.response?.cursor;
  } while (cursor);
  return variations;
}

function loadProducts() {
  if (!fs.existsSync(SEED_PATH)) throw new Error(`Missing ${SEED_PATH}`);
  const data = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
  return data.products ?? [];
}

function saveProducts(products) {
  const data = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
  data.products = products;
  fs.writeFileSync(SEED_PATH, JSON.stringify(data, null, 2));
}

const variations = await listAllVariations();
console.log(`Square catalog: ${variations.length} variations`);

const products = loadProducts();
let matched = 0;

for (const product of products) {
  const key = strip(product.name);
  const hit =
    variations.find((v) => v.label === key) ||
    variations.find((v) => key.includes(v.label) || v.label.includes(key));
  if (hit) {
    product.squareVariationId = hit.id;
    matched += 1;
  }
}

saveProducts(products);
console.log(`Matched ${matched} / ${products.length} products. Updated ${SEED_PATH}`);
console.log("Run npm run seed to push squareVariationId values to Supabase.");
