/**
 * One-time importer: Square catalog CSV -> local data/store.json
 *
 * - Copies the provided dish photos into public/menu-images (slugged, `sq-` prefix)
 * - Parses the Square catalog export, filters sellable/available items,
 *   converts dollar prices to integer cents, flattens variations
 * - Auto-creates categories from the CSV reporting categories
 * - Maps photos to items by fuzzy name match
 * - Replaces the `categories` + `products` collections in data/store.json,
 *   preserving every other collection (reviews, gallery, menus, settings, ...)
 *
 * Usage:  node scripts/import-square-catalog.mjs [csvPath] [imageDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const CSV_PATH = process.argv[2] ||
  'C:/Users/henri/Downloads/ML2T5D79GVTV3_catalog-2026-06-29-1943.csv';
const IMG_DIR = process.argv[3] ||
  'C:/Users/henri/Downloads/600f6bf9-d761-46d8-bcb9-e54f7e6ecc16';

const STORE_PATH = path.join(PROJECT_ROOT, 'data', 'store.json');
const PUBLIC_IMG_DIR = path.join(PROJECT_ROOT, 'public', 'menu-images');

// ── helpers ───────────────────────────────────────────────────────────
const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (s) => stripAccents(String(s || '').toLowerCase()).replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  stripAccents(String(s || '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Minimal RFC-4180 CSV parser (handles quotes + embedded newlines/commas). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* ignore */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// ── category display names (English | Spanish) ────────────────────────
const CATEGORY_EN = {
  'desayunos': 'Breakfast',
  'almuerzos': 'Lunch',
  'bebidas': 'Drinks',
  'postres': 'Desserts',
  'pavlova': 'Pavlova',
  'frosting': 'Cakes',
  'sandwiches': 'Sandwiches',
  'pizzas y spaguettis': 'Pizza & Pasta',
  'otros': 'More',
};
const CATEGORY_ORDER = ['pavlova', 'postres', 'frosting', 'desayunos', 'almuerzos', 'sandwiches', 'pizzas y spaguettis', 'bebidas', 'otros'];
const titleCase = (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));

// ── image → match keywords (first matching product wins) ──────────────
const IMAGE_MATCHERS = [
  { file: 'Alfajor', keys: ['alfajor'] },
  { file: 'Bisteak', keys: ['bistec de res', 'bistec'] },
  { file: 'Cafe Con Leche', keys: ['cafe con leche grande', 'cafe con leche'] },
  { file: 'Caramel Iced Coffee', keys: ['cafe frio'] },
  { file: 'Cheesecake Parchito', keys: ['cheesecake', 'pan de queso'] },
  { file: 'Chicken Tostones Salad', keys: ['ensalada'] },
  { file: 'Chocolate Cake', keys: ['cake'] },
  { file: 'Colada', keys: ['colada'] },
  { file: 'Copa Especial', keys: ['copa pavlova', 'copa'] },
  { file: 'Cuban', keys: ['sandwiche cubano', 'cubano'] },
  { file: 'Dulce De Leche And Nutella Cake', keys: ['tortas decoradas'] },
  { file: 'Empanada Cubana', keys: ['empanadas'] },
  { file: 'Empanado Venezuela', keys: ['empanadas venezolanas'] },
  { file: 'Fish Rice Salad', keys: ['filete de pescado'] },
  { file: 'Flan', keys: ['flan'] },
  { file: 'Ham And Cheese Sandwich', keys: ['sandwich de jamon', 'jamon y queso'] },
  { file: 'Ham Croquetqos', keys: ['pan croqueta', 'croqueta'] },
  { file: 'Ice Cream Pavlove Dulce De Leche', keys: ['pavlova grande'] },
  { file: 'Ice Cream Pavlove Nutella', keys: ['pavlova mediana'] },
  { file: 'Milhojas', keys: ['milhojas'] },
  { file: 'Orange Juice', keys: ['jugo naranja'] },
  { file: 'Pavlova Nutella', keys: ['pavlova pequena', 'pavlova'] },
  { file: 'Pork Chop', keys: ['chuleta'] },
  { file: 'Pork Congri Plaintain', keys: ['cerdo asado'] },
  { file: 'Profiterol', keys: ['profiterol'] },
  { file: 'Ropa Veja', keys: ['ropa vieja'] },
  { file: 'Sandwich Pavlove Crispy Chicken', keys: ['pollo crispy'] },
  { file: 'Tequenos', keys: ['tequeno'] },
  { file: 'Tortaleto Fresas', keys: ['tartaleta'] },
];

// Items chosen for the homepage "signature" section (must have a photo).
const FEATURED_KEYS = ['milhojas', 'profiterol', 'flan', 'tortas decoradas', 'cake', 'copa pavlova', 'pavlova'];
// Sweet categories the homepage signature fallback may pull from.
const SWEET_SLUGS = ['pavlova', 'postres', 'frosting'];

// ── 1. copy images ────────────────────────────────────────────────────
fs.mkdirSync(PUBLIC_IMG_DIR, { recursive: true });
const imageFiles = fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];
const matcherToPublic = new Map(); // matcher.file (lower) -> /menu-images/sq-...

for (const m of IMAGE_MATCHERS) {
  const src = imageFiles.find((f) => norm(f).startsWith(norm(m.file)));
  if (!src) { console.warn(`! photo not found for "${m.file}"`); continue; }
  const ext = path.extname(src).toLowerCase() || '.jpg';
  const dest = `sq-${slugify(m.file)}${ext}`;
  fs.copyFileSync(path.join(IMG_DIR, src), path.join(PUBLIC_IMG_DIR, dest));
  matcherToPublic.set(m.file, `/menu-images/${dest}`);
}
console.log(`Copied ${matcherToPublic.size} photos -> public/menu-images/`);

// ── 2. parse CSV ──────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf-8'));
const header = rows[0].map((h) => h.trim());
const idx = (name) => header.indexOf(name);
const COL = {
  item: idx('Item Name'),
  variation: idx('Variation Name'),
  desc: idx('Description'),
  categories: idx('Categories'),
  reporting: idx('Reporting Category'),
  visibility: idx('Square Online Item Visibility'),
  price: idx('Price'),
  archived: idx('Archived'),
  sellable: idx('Sellable'),
};

const categoryMap = new Map(); // key -> {id, name, nameEs, slug, sortOrder}
let categoryId = 0;
function ensureCategory(rawCat) {
  const key = norm(rawCat) || 'otros';
  if (categoryMap.has(key)) return categoryMap.get(key).id;
  categoryId += 1;
  const nameEs = key === 'otros' ? 'Otros' : titleCase(rawCat.trim());
  const cat = {
    id: categoryId,
    name: CATEGORY_EN[key] || titleCase(rawCat.trim() || 'More'),
    nameEs,
    slug: slugify(key),
    sortOrder: (CATEGORY_ORDER.indexOf(key) + 1) || 99,
  };
  categoryMap.set(key, cat);
  return cat.id;
}

const products = [];
let productId = 0;
const now = new Date().toISOString();

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.length < header.length - 2) continue;
  const itemName = (row[COL.item] || '').trim();
  if (!itemName) continue;

  const archived = (row[COL.archived] || '').trim().toUpperCase();
  const sellable = (row[COL.sellable] || '').trim().toUpperCase();
  const visibility = norm(row[COL.visibility]);
  const priceRaw = (row[COL.price] || '').trim();

  if (archived === 'Y') continue;
  if (sellable === 'N') continue;
  if (visibility === 'unavailable') continue;
  if (!priceRaw || norm(priceRaw) === 'variable') continue;
  const priceNum = parseFloat(priceRaw);
  if (!isFinite(priceNum) || priceNum <= 0) continue;

  const variation = (row[COL.variation] || '').trim();
  const hasVariation = variation && norm(variation) !== 'sin variacion';
  const name = hasVariation ? `${itemName} — ${variation}` : itemName;

  const rawCat = (row[COL.reporting] || row[COL.categories] || '').trim();
  const catId = ensureCategory(rawCat);
  const desc = (row[COL.desc] || '').trim().replace(/\s+/g, ' ') || null;

  productId += 1;
  products.push({
    id: productId,
    name,
    nameEs: name,
    description: desc,
    descriptionEs: desc,
    price: Math.round(priceNum * 100),
    categoryId: catId,
    imageUrl: null,
    available: true,
    featured: false,
    sortOrder: productId,
    dietaryTags: [],
    createdAt: now,
  });
}

// ── 3. map photos to products ─────────────────────────────────────────
for (const m of IMAGE_MATCHERS) {
  const pub = matcherToPublic.get(m.file);
  if (!pub) continue;
  const target = products.find((p) => !p.imageUrl && m.keys.some((k) => norm(p.name).includes(norm(k))));
  if (target) target.imageUrl = pub;
}

// ── 4. featured selection ─────────────────────────────────────────────
let featuredCount = 0;
for (const key of FEATURED_KEYS) {
  if (featuredCount >= 6) break;
  const p = products.find((pr) => pr.imageUrl && norm(pr.name).includes(norm(key)) && !pr.featured);
  if (p) { p.featured = true; featuredCount += 1; }
}
// Fallback: top up featured with photographed items from sweet categories only
const sweetCatIds = new Set([...categoryMap.values()].filter((c) => SWEET_SLUGS.includes(c.slug)).map((c) => c.id));
if (featuredCount < 6) {
  for (const p of products) {
    if (featuredCount >= 6) break;
    if (p.imageUrl && !p.featured && sweetCatIds.has(p.categoryId)) { p.featured = true; featuredCount += 1; }
  }
}

// ── 5. write store.json (preserve other collections) ──────────────────
const toMap = (arr) => Object.fromEntries(arr.map((x) => [String(x.id), x]));
let store = { collections: {}, counters: {} };
if (fs.existsSync(STORE_PATH)) {
  try { store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')); } catch { /* start fresh */ }
}
store.collections = store.collections || {};
store.counters = store.counters || {};

const categories = [...categoryMap.values()].sort((a, b) => a.sortOrder - b.sortOrder);
store.collections.categories = toMap(categories);
store.collections.products = toMap(products);
store.counters.categories = categoryId;
store.counters.products = productId;

fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');

console.log(`Imported ${categories.length} categories, ${products.length} products.`);
console.log(`Photos attached: ${products.filter((p) => p.imageUrl).length}. Featured: ${featuredCount}.`);
console.log(`Wrote ${STORE_PATH}`);
