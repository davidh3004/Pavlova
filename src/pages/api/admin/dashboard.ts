import type { APIRoute } from "astro";
import { COL, listAll, queryEq } from "@/server/store";
import { json, error, run } from "@/server/http";
import { getAdminId } from "@/server/auth";
import { mapOrder } from "@/server/orders";

export const GET: APIRoute = ({ cookies }) =>
  run(async () => {
    if (!getAdminId(cookies)) return error("Not authenticated", 401);

    const [allOrders, newCatering, newCustom, products, reviews] = await Promise.all([
      listAll(COL.orders, { orderBy: "createdAt", dir: "desc" }),
      queryEq(COL.cateringInquiries, "status", "new"),
      queryEq(COL.customOrders, "status", "new"),
      listAll(COL.products),
      listAll(COL.reviews),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const ts = (o: any) => new Date(o.createdAt).getTime();

    const todayOrders = allOrders.filter((o) => ts(o) >= todayMs);
    const todayRevenue = todayOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
    const totalRevenue = allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
    const pendingOrders = allOrders.filter((o) => o.status === "pending").length;

    return json({
      // legacy fields
      todayOrders: todayOrders.length,
      todayRevenue: todayRevenue.toFixed(2),
      newCateringInquiries: newCatering.length,
      newCustomOrders: newCustom.length,
      menuPublishedToday: false,
      recentOrders: allOrders.slice(0, 5).map(mapOrder),
      // fields used by the dashboard UI
      totalOrders: allOrders.length,
      pendingOrders,
      totalRevenue: Math.round(totalRevenue),
      totalProducts: products.length,
      totalReviews: reviews.length,
      pendingCatering: newCatering.length,
    });
  });
