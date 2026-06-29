import type { APIRoute } from "astro";
import { COL, update, remove } from "@/server/store";
import { json, error, readBody, noContent, run, toNumber } from "@/server/http";

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const itemId = toNumber(params.itemId);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    for (const key of [
      "name", "nameEs", "description", "descriptionEs", "imageUrl",
      "available", "soldOut", "featured", "sortOrder", "sectionId", "productId",
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.price !== undefined) patch.price = body.price;
    const item = await update(COL.menuItems, itemId, patch);
    if (!item) return error("Not found", 404);
    return json({ ...item, price: String(item.price) });
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;

export const DELETE: APIRoute = ({ params }) =>
  run(async () => {
    await remove(COL.menuItems, toNumber(params.itemId));
    return noContent();
  });
