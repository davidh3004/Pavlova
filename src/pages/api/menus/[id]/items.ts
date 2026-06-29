import type { APIRoute } from "astro";
import { COL, create } from "@/server/store";
import { json, readBody, run, toNumber } from "@/server/http";

export const POST: APIRoute = ({ params, request }) =>
  run(async () => {
    const menuId = toNumber(params.id);
    const body = await readBody(request);
    const item = await create(COL.menuItems, {
      menuId,
      sectionId: body.sectionId ?? null,
      productId: body.productId ?? null,
      name: body.name,
      nameEs: body.nameEs ?? null,
      description: body.description ?? null,
      descriptionEs: body.descriptionEs ?? null,
      price: body.price ?? 0,
      imageUrl: body.imageUrl ?? null,
      available: body.available ?? true,
      soldOut: body.soldOut ?? false,
      featured: body.featured ?? false,
      sortOrder: body.sortOrder ?? 0,
    });
    return json({ ...item, price: String(item.price) }, 201);
  });
