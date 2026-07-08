/**
 * Create Square Orders from website pickup orders so they appear in Square POS / KDS.
 */
import { randomUUID } from "node:crypto";
import type { SquareClient } from "square";
import type { OrderLineItem } from "square";
import { COL, getById } from "./store";
import { getSquareLocationId } from "./square";

type WebsiteOrderItem = {
  name: string;
  quantity: number;
  price: number;
  productId?: number | null;
  specialInstructions?: string | null;
};

type WebsiteOrder = {
  id: number;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  pickupTime?: string | null;
  discount?: string;
  items?: WebsiteOrderItem[];
};

function itemPriceCents(item: WebsiteOrderItem): number {
  return Math.round(Number(item.price) || 0);
}

async function buildLineItems(items: WebsiteOrderItem[]): Promise<OrderLineItem[]> {
  const lineItems: OrderLineItem[] = [];

  for (const item of items) {
    const qty = String(Math.max(1, Number(item.quantity) || 1));
    const note = item.specialInstructions?.trim() || undefined;

    let catalogObjectId: string | undefined;
    if (item.productId) {
      try {
        const product = await getById(COL.products, Number(item.productId));
        catalogObjectId = product?.squareVariationId || product?.squareCatalogId;
      } catch {
        /* product lookup optional */
      }
    }

    if (catalogObjectId) {
      lineItems.push({
        catalogObjectId,
        quantity: qty,
        ...(note ? { note } : {}),
      });
    } else {
      lineItems.push({
        name: item.name,
        quantity: qty,
        basePriceMoney: {
          amount: BigInt(itemPriceCents(item)),
          currency: "USD",
        },
        ...(note ? { note } : {}),
      });
    }
  }

  return lineItems;
}

export async function createSquareOrder(
  client: SquareClient,
  order: WebsiteOrder,
): Promise<string> {
  const locationId = getSquareLocationId();
  const items = order.items ?? [];
  if (items.length === 0) throw new Error("Order has no line items");

  const lineItems = await buildLineItems(items);
  const discountCents = Math.round(Number(order.discount ?? 0));

  const response = await client.orders.create({
    idempotencyKey: randomUUID(),
    order: {
      locationId,
      referenceId: order.orderNumber || `PLT-${order.id}`,
      source: { name: "Pavlova Website" },
      lineItems,
      ...(discountCents > 0
        ? {
            discounts: [
              {
                uid: "website-discount",
                name: "Discount",
                amountMoney: { amount: BigInt(discountCents), currency: "USD" },
                scope: "ORDER",
              },
            ],
          }
        : {}),
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickupDetails: {
            recipient: {
              displayName: order.customerName || undefined,
              phoneNumber: order.customerPhone || undefined,
              emailAddress: order.customerEmail || undefined,
            },
            note: order.pickupTime ? `Pickup: ${order.pickupTime}` : "Website pickup",
            scheduleType: "ASAP",
          },
        },
      ],
    },
  });

  if (response.errors?.length) {
    const detail = response.errors.map((e) => e.detail || e.code).join("; ");
    throw new Error(detail || "Square order creation failed");
  }

  const squareOrderId = response.order?.id;
  if (!squareOrderId) throw new Error("Square order creation returned no order id");
  return squareOrderId;
}

/** After a card/wallet payment, mark the Square order paid (required when fulfillments exist). */
export async function paySquareOrder(
  client: SquareClient,
  squareOrderId: string,
  paymentId: string,
): Promise<void> {
  const response = await client.orders.pay({
    orderId: squareOrderId,
    idempotencyKey: randomUUID(),
    paymentIds: [paymentId],
  });

  if (response.errors?.length) {
    const detail = response.errors.map((e) => e.detail || e.code).join("; ");
    throw new Error(detail || "Square PayOrder failed");
  }
}
