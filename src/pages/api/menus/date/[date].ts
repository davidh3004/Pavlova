import type { APIRoute } from "astro";
import { COL, queryEq } from "@/server/store";
import { json, error, run } from "@/server/http";
import { getMenuWithItems } from "@/server/menus";

export const GET: APIRoute = ({ params }) =>
  run(async () => {
    const date = params.date;
    if (!date) return error("Date is required");
    const menus = await queryEq(COL.menus, "date", date, { orderBy: "createdAt", dir: "desc" });
    if (menus.length === 0) return error("Not found", 404);
    return json(await getMenuWithItems(menus[0].id));
  });
