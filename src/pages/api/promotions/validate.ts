import type { APIRoute } from "astro";
import { COL, queryEq } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    if (!body.code) return json({ valid: false, message: "Invalid promo code" });

    const promos = await queryEq(COL.promotions, "active", true);
    const promo = promos.find((p) => p.code?.toLowerCase() === String(body.code).toLowerCase());
    if (!promo) return json({ valid: false, message: "Invalid promo code" });

    const now = Date.now();
    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) {
      return json({ valid: false, message: "Promo code has expired" });
    }
    if (promo.startsAt && new Date(promo.startsAt).getTime() > now) {
      return json({ valid: false, message: "Promo code not yet active" });
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return json({ valid: false, message: "Promo code has reached its usage limit" });
    }

    const orderTotal = parseFloat(String(body.orderTotal ?? 0));
    if (promo.minimumOrder && orderTotal < parseFloat(String(promo.minimumOrder))) {
      return json({ valid: false, message: `Minimum order of $${promo.minimumOrder} required` });
    }

    let discount: number;
    if (promo.discountType === "percentage") {
      discount = orderTotal * (parseFloat(String(promo.discountValue)) / 100);
    } else {
      discount = parseFloat(String(promo.discountValue));
    }
    discount = Math.min(discount, orderTotal);

    return json({
      valid: true,
      discount: discount.toFixed(2),
      discountAmount: Math.round(discount),
      promotionId: promo.id,
      message: `${promo.name ?? "Promo"} applied!`,
    });
  });
