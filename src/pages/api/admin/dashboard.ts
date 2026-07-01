import type { APIRoute } from "astro";
import { COL, listAll, queryEq } from "@/server/store";
import { json, error, run } from "@/server/http";
import { getAdminId } from "@/server/auth";
import { getOrdersWithItems } from "@/server/orders";

export const GET: APIRoute = ({ cookies }) =>
  run(async () => {
    if (!getAdminId(cookies)) return error("Not authenticated", 401);

    const [allOrders, newCatering, newCustom, products, reviews, recentOrders] = await Promise.all([
      listAll(COL.orders, { orderBy: "createdAt", dir: "desc" }),
      queryEq(COL.cateringInquiries, "status", "new"),
      queryEq(COL.customOrders, "status", "new"),
      listAll(COL.products),
      listAll(COL.reviews),
      getOrdersWithItems({ limit: 5 }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const ts = (o: any) => new Date(o.createdAt).getTime();

    const todayOrders = allOrders.filter((o) => ts(o) >= todayMs);
    const sumCents = (rows: any[]) =>
      rows
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + Math.round(Number(o.total ?? 0)), 0);

    const todayRevenue = sumCents(todayOrders);
    const totalRevenue = sumCents(allOrders);
    const pendingOrders = allOrders.filter((o) => o.status === "pending").length;

    return json({
      todayOrders: todayOrders.length,
      todayRevenue: (todayRevenue / 100).toFixed(2),
      newCateringInquiries: newCatering.length,
      newCustomOrders: newCustom.length,
      menuPublishedToday: false,
      recentOrders,
      totalOrders: allOrders.length,
      pendingOrders,
      totalRevenue,
      totalProducts: products.length,
      totalReviews: reviews.length,
      pendingCatering: newCatering.length,
    });
  });
