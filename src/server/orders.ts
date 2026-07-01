import { COL, getById, listAll, queryEq } from "./store";

/** Order serialization shared across order routes (mirrors old API shape). */
export function mapOrderItem(i: any) {
  return {
    id: i.id,
    name: i.name,
    quantity: Number(i.quantity) || 1,
    price: Number(i.price) || 0,
    productId: i.productId ?? null,
    menuItemId: i.menuItemId ?? null,
    specialInstructions: i.specialInstructions ?? null,
  };
}

/** Stored totals are cent sums saved as decimal strings (e.g. "599.00" = $5.99). */
function totalCents(o: any): number {
  return Math.round(Number(o.total ?? o.totalAmount ?? 0));
}

export function mapOrder(o: any, items?: any[]) {
  const mapped: Record<string, any> = {
    ...o,
    subtotal: String(o.subtotal),
    discount: o.discount != null ? String(o.discount) : "0.00",
    total: String(o.total),
    totalAmount: totalCents(o),
    createdAt: o.createdAt,
  };
  if (Array.isArray(items)) {
    mapped.items = items.map(mapOrderItem);
  }
  return mapped;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `PLT-${ts}`;
}

function groupItemsByOrder(allItems: any[]): Map<number, any[]> {
  const byOrder = new Map<number, any[]>();
  for (const item of allItems) {
    const orderId = Number(item.orderId);
    if (!byOrder.has(orderId)) byOrder.set(orderId, []);
    byOrder.get(orderId)!.push(item);
  }
  return byOrder;
}

/** List orders with nested line items (used by admin). */
export async function getOrdersWithItems(opts?: { status?: string; limit?: number }) {
  let orders = await listAll(COL.orders, { orderBy: "createdAt", dir: "desc" });
  if (opts?.status) orders = orders.filter((o) => o.status === opts.status);
  if (opts?.limit) orders = orders.slice(0, opts.limit);

  const allItems = await listAll(COL.orderItems);
  const byOrder = groupItemsByOrder(allItems);

  return orders.map((o) => mapOrder(o, byOrder.get(Number(o.id)) ?? []));
}

/** Single order with line items. */
export async function getOrderWithItems(id: number) {
  const order = await getById(COL.orders, id);
  if (!order) return null;
  const items = await queryEq(COL.orderItems, "orderId", id);
  return mapOrder(order, items);
}
