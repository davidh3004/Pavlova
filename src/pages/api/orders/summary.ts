import type { APIRoute } from "astro";
import { COL, listAll } from "@/server/store";
import { json, run } from "@/server/http";

export const GET: APIRoute = () =>
  run(async () => {
    const allOrders = await listAll(COL.orders);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const ts = (o: any) => new Date(o.createdAt).getTime();
    const todayOrders = allOrders.filter((o) => ts(o) >= todayMs);
    const todayRevenue = todayOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + parseFloat(String(o.total)), 0);

    const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
    const activeOrders = allOrders.filter((o) =>
      ["confirmed", "preparing", "ready"].includes(o.status)
    ).length;
    const completedToday = todayOrders.filter((o) => o.status === "completed").length;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekRevenue = allOrders
      .filter((o) => ts(o) >= weekAgo && o.status !== "cancelled")
      .reduce((sum, o) => sum + parseFloat(String(o.total)), 0);

    return json({
      todayOrders: todayOrders.length,
      todayRevenue: todayRevenue.toFixed(2),
      pendingOrders,
      activeOrders,
      completedToday,
      weekRevenue: weekRevenue.toFixed(2),
    });
  });
