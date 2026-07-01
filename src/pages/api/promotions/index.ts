import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";

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

export const GET: APIRoute = ({ url }) =>
  run(async () => {
    let promotions = await listAll(COL.promotions, { orderBy: "createdAt", dir: "desc" });
    const active = url.searchParams.get("active");
    if (active === "true") promotions = promotions.filter((p) => p.active);
    else if (active === "false") promotions = promotions.filter((p) => !p.active);
    return json(promotions.map(mapPromo));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const promo = await create(COL.promotions, {
      code: body.code ?? null,
      name: body.name ?? null,
      description: body.description ?? null,
      discountType: body.discountType ?? "percentage",
      discountValue: body.discountValue ?? 0,
      minimumOrder: body.minimumOrder ?? null,
      active: body.active ?? true,
      usageLimit: body.usageLimit ?? null,
      usageCount: 0,
      startsAt: body.startsAt ?? null,
      expiresAt: body.expiresAt ?? null,
    });
    return json(mapPromo(promo), 201);
  });
