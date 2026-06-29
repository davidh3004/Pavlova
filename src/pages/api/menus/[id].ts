import type { APIRoute } from "astro";
import { COL, update, remove, removeWhere } from "@/server/store";
import { json, error, readBody, noContent, run, toNumber } from "@/server/http";
import { getMenuWithItems } from "@/server/menus";

export const GET: APIRoute = ({ params }) =>
  run(async () => {
    const result = await getMenuWithItems(toNumber(params.id));
    if (!result) return error("Not found", 404);
    return json(result);
  });

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    for (const key of ["date", "title", "titleEs", "published", "note", "noteEs"]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    const menu = await update(COL.menus, id, patch);
    if (!menu) return error("Not found", 404);
    return json({ ...menu, date: menu.date, createdAt: menu.createdAt });
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;

export const DELETE: APIRoute = ({ params }) =>
  run(async () => {
    const id = toNumber(params.id);
    await Promise.all([
      remove(COL.menus, id),
      removeWhere(COL.menuSections, "menuId", id),
      removeWhere(COL.menuItems, "menuId", id),
    ]);
    return noContent();
  });
