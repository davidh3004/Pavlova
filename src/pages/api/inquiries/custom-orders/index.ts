import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";
import { notifyCustomOrderInquiry, sendEmailSafe } from "@/server/email";

function buildCustomOrderDetails(body: Record<string, unknown>): string | null {
  const parts = [
    body.dessertType ? `Type: ${body.dessertType}` : "",
    body.size ? `Size: ${body.size}` : "",
    body.flavors ? `Flavors: ${body.flavors}` : "",
    body.notes ? `Notes: ${body.notes}` : "",
    body.imageUrl ? `Inspiration: ${body.imageUrl}` : "",
  ].filter(Boolean);
  if (parts.length) return parts.join("\n");
  return body.details ? String(body.details) : null;
}

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
      occasion: body.occasion ?? body.dessertType ?? null,
      neededDate: body.neededDate ?? body.neededBy ?? null,
      servings: body.servings ?? body.size ?? null,
      details: buildCustomOrderDetails(body),
      budget: body.budget ?? null,
      status: "new",
      notes: null,
    });
    sendEmailSafe(() =>
      notifyCustomOrderInquiry({
        ...order,
        dessertType: body.dessertType ?? null,
        size: body.size ?? null,
        flavors: body.flavors ?? null,
        imageUrl: body.imageUrl ?? null,
        notes: body.notes ?? null,
      }),
    );
    return json({ ...order, createdAt: order.createdAt }, 201);
  });
