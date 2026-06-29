import type { APIRoute } from "astro";
import { COL, update, remove } from "@/server/store";
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
    await remove(COL.categories, toNumber(params.id));
    return noContent();
  });
