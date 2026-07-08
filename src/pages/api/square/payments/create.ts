import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { COL, update } from "@/server/store";
import { json, error, readBody, run } from "@/server/http";
import { getSquareClient, getSquareLocationId, decimalToSquareMoney } from "@/server/square";
import { getOrderWithItems } from "@/server/orders";
import { notifyNewOrder, notifyOrderConfirmation, sendEmailSafe } from "@/server/email";
import { notifyOrderSmsConfirmation, sendSmsSafe } from "@/server/sms";
import { createSquareOrder, paySquareOrder } from "@/server/squareOrders";

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const client = getSquareClient();
    if (!client) return error("Square payments not configured", 503);

    const body = await readBody(request);
    const { sourceId, amount, currency = "USD", orderId, customerEmail, customerName } = body;
    if (!sourceId || !amount) return error("sourceId and amount are required");
    if (!orderId) return error("orderId is required");

    try {
      const websiteOrderId = Number(orderId);
      let fullOrder = await getOrderWithItems(websiteOrderId);
      if (!fullOrder) return error("Order not found", 404);

      const orderForSquare = fullOrder as Parameters<typeof createSquareOrder>[1];

      // Create a Square Order (or reuse one from a prior attempt) so staff see line items in POS.
      let squareOrderId = fullOrder.squareOrderId as string | undefined;
      if (!squareOrderId) {
        squareOrderId = await createSquareOrder(client, orderForSquare);
        await update(COL.orders, websiteOrderId, { squareOrderId });
        fullOrder = { ...fullOrder, squareOrderId };
      }

      const squareOrderRes = await client.orders.get({ orderId: squareOrderId });
      const squareTotal = squareOrderRes.order?.totalMoney?.amount;
      const amountMoney = squareTotal != null
        ? Number(squareTotal)
        : decimalToSquareMoney(amount);

      const response = await client.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        orderId: squareOrderId,
        amountMoney: { amount: BigInt(amountMoney), currency },
        locationId: getSquareLocationId(),
        autocomplete: true,
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
      if (payment.id) {
        try {
          await paySquareOrder(client, squareOrderId, payment.id);
        } catch (payErr) {
          console.error("[square] PayOrder after payment:", payErr);
        }
      }

      await update(COL.orders, websiteOrderId, {
        status: "confirmed",
        squareOrderId,
        squarePaymentId: payment.id ?? null,
      });

      fullOrder = await getOrderWithItems(websiteOrderId);
      if (fullOrder) {
        const notifyOrder = fullOrder as Parameters<typeof notifyNewOrder>[0];
        sendEmailSafe(async () => {
          await notifyNewOrder(notifyOrder, { paid: true });
          await notifyOrderConfirmation(notifyOrder, { paid: true });
        });
        sendSmsSafe(() => notifyOrderSmsConfirmation(notifyOrder));
      }

      return json({
        paymentId: payment.id,
        squareOrderId,
        status: payment.status,
        receiptUrl: payment.receiptUrl,
        amountMoney: payment.amountMoney
          ? { amount: Number(payment.amountMoney.amount), currency: payment.amountMoney.currency }
          : null,
      });
    } catch (err: any) {
      if (err?.errors) return json({ errors: err.errors }, 402);
      return error(err?.message ?? "Payment failed", 500);
    }
  });
