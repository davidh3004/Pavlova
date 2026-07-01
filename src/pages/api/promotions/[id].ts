import type { APIRoute } from "astro";
import { COL, update, remove } from "@/server/store";
import { json, error, readBody, noContent, run, toNumber } from "@/server/http";

function mapPromo(p: any) {
  return {
    ...p,
    discountValue: String(p.discountValue),
    minimumOrder: p.minimumOrder != null ? String(p.minimumOrder) : null,
    createdAt: p.createdAt,
    startsAt: p.startsAt ?? null,
    expiresAt: p.expiresAt ?? null,
  };
}

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    for (const key of [
      "code", "name", "description", "discountType", "discountValue",
      "minimumOrder", "active", "usageLimit", "usageCount", "startsAt", "expiresAt",
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    const promo = await update(COL.promotions, id, patch);
    if (!promo) return error("Not found", 404);
    return json(mapPromo(promo));
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;

export const DELETE: APIRoute = ({ params }) =>
  run(async () => {
    await remove(COL.promotions, toNumber(params.id));
    return noContent();
  });
