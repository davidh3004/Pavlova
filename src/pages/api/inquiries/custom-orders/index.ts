import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const GET: APIRoute = () =>
  run(async () => {
    const rows = await listAll(COL.customOrders, { orderBy: "createdAt", dir: "desc" });
    return json(rows.map((o) => ({ ...o, createdAt: o.createdAt })));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const order = await create(COL.customOrders, {
      name: body.name ?? "",
      email: body.email ?? "",
      phone: body.phone ?? null,
      occasion: body.occasion ?? null,
      neededDate: body.neededDate ?? null,
      servings: body.servings ?? null,
      details: body.details ?? null,
      budget: body.budget ?? null,
      status: "new",
      notes: null,
    });
    return json({ ...order, createdAt: order.createdAt }, 201);
  });
