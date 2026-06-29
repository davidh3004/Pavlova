import type { APIRoute } from "astro";
import { COL, listAll, getById, update, remove } from "@/server/store";
import { json, error, readBody, noContent, run, toNumber } from "@/server/http";

function mapProduct(p: any, catMap: Map<number, string>) {
  return {
    ...p,
    price: String(p.price),
    categoryName: catMap.get(p.categoryId) ?? "",
    createdAt: p.createdAt,
    dietaryTags: p.dietaryTags ?? [],
  };
}

export const GET: APIRoute = ({ params }) =>
  run(async () => {
    const id = toNumber(params.id);
    const product = await getById(COL.products, id);
    if (!product) return error("Not found", 404);
    const cats = await listAll(COL.categories);
    const catMap = new Map<number, string>(cats.map((c) => [c.id, c.name]));
    return json(mapProduct(product, catMap));
  });

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    for (const key of [
      "name", "nameEs", "description", "descriptionEs", "categoryId",
      "imageUrl", "available", "featured", "sortOrder", "dietaryTags",
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.price !== undefined) patch.price = body.price;
    const product = await update(COL.products, id, patch);
    if (!product) return error("Not found", 404);
    const cats = await listAll(COL.categories);
    const catMap = new Map<number, string>(cats.map((c) => [c.id, c.name]));
    return json(mapProduct(product, catMap));
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;

export const DELETE: APIRoute = ({ params }) =>
  run(async () => {
    await remove(COL.products, toNumber(params.id));
    return noContent();
  });
