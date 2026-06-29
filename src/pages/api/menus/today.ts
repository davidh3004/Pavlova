import type { APIRoute } from "astro";
import { COL, queryEq } from "@/server/store";
import { json, run } from "@/server/http";
import { getMenuWithItems } from "@/server/menus";

export const GET: APIRoute = () =>
  run(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const menus = await queryEq(COL.menus, "date", today, { orderBy: "createdAt", dir: "desc" });
    if (menus.length === 0) return json(null);
    return json(await getMenuWithItems(menus[0].id));
  });
