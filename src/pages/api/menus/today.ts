import type { APIRoute } from "astro";
import { COL, queryEq } from "@/server/store";
import { json, run } from "@/server/http";
import { getMenuWithItems } from "@/server/menus";

export const GET: APIRoute = () =>
  run(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const menus = await queryEq(COL.menus, "date", today, { orderBy: "createdAt", dir: "desc" });
    // Only surface a menu that has been published from the admin panel.
    const published = menus.find((m) => m.published);
    if (!published) return json(null);
    return json(await getMenuWithItems(published.id));
  });
