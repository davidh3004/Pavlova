import type { APIRoute } from "astro";
import { COL, update } from "@/server/store";
import { json, error, readBody, run, toNumber } from "@/server/http";
import { getOrderWithItems, mapOrder } from "@/server/orders";

export const GET: APIRoute = ({ params }) =>
  run(async () => {
    const id = toNumber(params.id);
    const result = await getOrderWithItems(id);
    if (!result) return error("Not found", 404);
    return json(result);
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
    return json(await getOrderWithItems(id));
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;
