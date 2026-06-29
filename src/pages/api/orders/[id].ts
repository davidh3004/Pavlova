import type { APIRoute } from "astro";
import { COL, getById, queryEq, update } from "@/server/store";
import { json, error, readBody, run, toNumber } from "@/server/http";
import { mapOrder } from "@/server/orders";

export const GET: APIRoute = ({ params }) =>
  run(async () => {
    const id = toNumber(params.id);
    const order = await getById(COL.orders, id);
    if (!order) return error("Not found", 404);
    const items = await queryEq(COL.orderItems, "orderId", id);
    return json({
      ...mapOrder(order),
      items: items.map((i) => ({ ...i, price: String(i.price) })),
    });
  });

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.pickupTime !== undefined) patch.pickupTime = body.pickupTime;
    const order = await update(COL.orders, id, patch);
    if (!order) return error("Not found", 404);
    return json(mapOrder(order));
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;
