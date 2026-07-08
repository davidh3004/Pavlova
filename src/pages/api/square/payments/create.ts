import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { COL, update } from "@/server/store";
import { json, error, readBody, run } from "@/server/http";
import { getSquareClient, getSquareLocationId, decimalToSquareMoney } from "@/server/square";
import { getOrderWithItems } from "@/server/orders";
import { notifyNewOrder, notifyOrderConfirmation, sendEmailSafe } from "@/server/email";
import { notifyOrderSmsConfirmation, sendSmsSafe } from "@/server/sms";

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const client = getSquareClient();
    if (!client) return error("Square payments not configured", 503);

    const body = await readBody(request);
    const { sourceId, amount, currency = "USD", orderId, customerEmail, customerName, note } = body;
    if (!sourceId || !amount) return error("sourceId and amount are required");

    try {
      const amountMoney = decimalToSquareMoney(amount);
      let paymentNote = note as string | undefined;
      if (!paymentNote && orderId) {
        const fullOrder = await getOrderWithItems(Number(orderId));
        if (fullOrder) {
          const items = (fullOrder.items ?? [])
            .map((i) => `${i.quantity}x ${i.name}`)
            .join(", ");
          paymentNote = [
            items || null,
            fullOrder.pickupTime ? `Pickup: ${fullOrder.pickupTime}` : null,
            fullOrder.customerName,
            fullOrder.customerPhone,
          ]
            .filter(Boolean)
            .join(" | ")
            .slice(0, 500);
        }
      }

      const response = await client.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: { amount: BigInt(amountMoney), currency },
        locationId: getSquareLocationId(),
        note: paymentNote ?? undefined,
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
      if (orderId) {
        await update(COL.orders, Number(orderId), { status: "confirmed" });
        const fullOrder = await getOrderWithItems(Number(orderId));
        if (fullOrder) {
          sendEmailSafe(async () => {
            await notifyNewOrder(fullOrder, { paid: true });
            await notifyOrderConfirmation(fullOrder, { paid: true });
          });
          sendSmsSafe(() => notifyOrderSmsConfirmation(fullOrder));
        }
      }

      return json({
        paymentId: payment.id,
        status: payment.status,
        receiptUrl: payment.receiptUrl,
        // Square returns money amounts as BigInt, which JSON.stringify cannot
        // serialize — coerce to a Number (cents) before sending.
        amountMoney: payment.amountMoney
          ? { amount: Number(payment.amountMoney.amount), currency: payment.amountMoney.currency }
          : null,
      });
    } catch (err: any) {
      if (err?.errors) return json({ errors: err.errors }, 402);
      return error(err?.message ?? "Payment failed", 500);
    }
  });
