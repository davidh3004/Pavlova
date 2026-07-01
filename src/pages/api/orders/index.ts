import type { APIRoute } from "astro";
import { COL, create } from "@/server/store";
import { json, error, readBody, run } from "@/server/http";
import { generateOrderNumber, getOrdersWithItems, getOrderWithItems } from "@/server/orders";

export const GET: APIRoute = ({ url }) =>
  run(async () => {
    const status = url.searchParams.get("status") ?? undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    return json(await getOrdersWithItems({ status, limit }));
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
    const discount = Number(body.discount) || 0;
    const total = Math.max(0, subtotal - discount);

    const order = await create(COL.orders, {
      orderNumber: generateOrderNumber(),
      customerName: body.customerName ?? "",
      customerEmail: body.customerEmail ?? null,
      customerPhone: body.customerPhone ?? "",
      pickupTime: body.pickupTime ?? null,
      status: "pending",
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: body.paymentMethod ?? null,
      promoCode: body.promoCode ?? null,
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

    return json(await getOrderWithItems(order.id), 201);
  });
