import type { APIRoute } from "astro";
import { COL, update, remove, queryEq } from "@/server/store";
import { json, error, readBody, noContent, run, toNumber } from "@/server/http";

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    for (const key of ["name", "nameEs", "slug", "sortOrder"]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    const category = await update(COL.categories, id, patch);
    if (!category) return error("Not found", 404);
    return json(category);
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;

export const DELETE: APIRoute = ({ params }) =>
  run(async () => {
    const id = toNumber(params.id);
    const products = await queryEq(COL.products, "categoryId", id);
    if (products.length > 0) {
      return error(
        `Cannot delete: ${products.length} product(s) use this category. Reassign them first.`,
        409,
      );
    }
    await remove(COL.categories, id);
    return noContent();
  });
