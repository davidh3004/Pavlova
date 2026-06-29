import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, error, readBody, run } from "@/server/http";
import { mapOrder, generateOrderNumber } from "@/server/orders";

export const GET: APIRoute = ({ url }) =>
  run(async () => {
    let orders = await listAll(COL.orders, { orderBy: "createdAt", dir: "desc" });
    const status = url.searchParams.get("status");
    if (status) orders = orders.filter((o) => o.status === status);
    const limit = url.searchParams.get("limit");
    if (limit) orders = orders.slice(0, Number(limit));
    return json(orders.map(mapOrder));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const items: any[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) return error("items are required");

    const subtotal = items.reduce(
      (sum, item) => sum + parseFloat(String(item.price)) * Number(item.quantity || 0),
      0
    );
    const total = subtotal;

    const order = await create(COL.orders, {
      orderNumber: generateOrderNumber(),
      customerName: body.customerName ?? "",
      customerEmail: body.customerEmail ?? null,
      customerPhone: body.customerPhone ?? "",
      pickupTime: body.pickupTime ?? null,
      status: "pending",
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: body.paymentMethod ?? null,
      specialInstructions: body.specialInstructions ?? null,
    });

    for (const item of items) {
      await create(COL.orderItems, {
        orderId: order.id,
        productId: item.productId ?? null,
        menuItemId: item.menuItemId ?? null,
        name: item.name,
        price: String(item.price),
        quantity: item.quantity,
        specialInstructions: item.specialInstructions ?? null,
      });
    }

    return json(mapOrder(order), 201);
  });
