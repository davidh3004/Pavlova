import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { COL, update } from "@/server/store";
import { json, error, readBody, run } from "@/server/http";
import { getSquareClient, SQUARE_LOCATION_ID, decimalToSquareMoney } from "@/server/square";

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const client = getSquareClient();
    if (!client) return error("Square payments not configured", 503);

    const body = await readBody(request);
    const { sourceId, amount, currency = "USD", orderId, customerEmail, customerName, note } = body;
    if (!sourceId || !amount) return error("sourceId and amount are required");

    try {
      const amountMoney = decimalToSquareMoney(amount);
      const response = await client.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: { amount: BigInt(amountMoney), currency },
        locationId: SQUARE_LOCATION_ID,
        note: note ?? `Pavlova Love Order${orderId ? ` #${orderId}` : ""}`,
        buyerEmailAddress: customerEmail,
        ...(customerName
          ? {
              billingAddress: {
                firstName: String(customerName).split(" ")[0],
                lastName: String(customerName).split(" ").slice(1).join(" ") || "",
              },
            }
          : {}),
      });

      if (response.errors?.length) return json({ errors: response.errors }, 402);

      const payment = response.payment!;
      if (orderId) await update(COL.orders, Number(orderId), { status: "confirmed" });

      return json({
        paymentId: payment.id,
        status: payment.status,
        receiptUrl: payment.receiptUrl,
        amountMoney: payment.amountMoney,
      });
    } catch (err: any) {
      if (err?.errors) return json({ errors: err.errors }, 402);
      return error(err?.message ?? "Payment failed", 500);
    }
  });
