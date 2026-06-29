import type { APIRoute } from "astro";
import { COL, listAll, queryEq } from "@/server/store";
import { json, run } from "@/server/http";

function mapProduct(p: any, catMap: Map<number, string>) {
  return {
    ...p,
    price: String(p.price),
    categoryName: catMap.get(p.categoryId) ?? "",
    createdAt: p.createdAt,
    dietaryTags: p.dietaryTags ?? [],
  };
}

export const GET: APIRoute = () =>
  run(async () => {
    const [all, cats] = await Promise.all([
      queryEq(COL.products, "featured", true, { orderBy: "sortOrder", dir: "asc" }),
      listAll(COL.categories),
    ]);
    const catMap = new Map<number, string>(cats.map((c) => [c.id, c.name]));
    const named = all.map((p) => mapProduct(p, catMap));
    const has = (p: any, ...keys: string[]) => {
      const n = (p.categoryName || "").toLowerCase();
      return keys.some((k) => n.includes(k));
    };
    return json({
      desserts: named.filter((p) => has(p, "dessert", "pavlova")),
      savory: named.filter((p) => has(p, "savory", "lunch", "breakfast")),
      pastries: named.filter((p) => has(p, "pastry", "pastries")),
      drinks: named.filter((p) => has(p, "drink", "coffee", "beverage")),
    });
  });
