import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run, toNumber } from "@/server/http";

function mapProduct(p: any, catMap: Map<number, string>) {
  return {
    ...p,
    price: String(p.price),
    categoryName: catMap.get(p.categoryId) ?? "",
    createdAt: p.createdAt,
    dietaryTags: p.dietaryTags ?? [],
  };
}

export const GET: APIRoute = ({ url }) =>
  run(async () => {
    const [products, cats] = await Promise.all([
      listAll(COL.products, { orderBy: "sortOrder", dir: "asc" }),
      listAll(COL.categories),
    ]);
    const catMap = new Map<number, string>(cats.map((c) => [c.id, c.name]));

    let rows = products;
    const categoryId = url.searchParams.get("categoryId");
    const featured = url.searchParams.get("featured");
    const available = url.searchParams.get("available");
    if (categoryId != null) rows = rows.filter((p) => p.categoryId === toNumber(categoryId));
    if (featured != null) rows = rows.filter((p) => p.featured === (featured === "true"));
    if (available != null) rows = rows.filter((p) => p.available === (available === "true"));

    return json(rows.map((p) => mapProduct(p, catMap)));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const product = await create(COL.products, {
      name: body.name,
      nameEs: body.nameEs ?? "",
      description: body.description ?? null,
      descriptionEs: body.descriptionEs ?? null,
      price: body.price ?? 0,
      categoryId: body.categoryId,
      imageUrl: body.imageUrl ?? null,
      available: body.available ?? true,
      featured: body.featured ?? false,
      sortOrder: body.sortOrder ?? 0,
      dietaryTags: body.dietaryTags ?? [],
    });
    const cats = await listAll(COL.categories);
    const catMap = new Map<number, string>(cats.map((c) => [c.id, c.name]));
    return json(mapProduct(product, catMap), 201);
  });
