import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";
import { getMenuWithItems, saveMenuSections } from "@/server/menus";

export const GET: APIRoute = () =>
  run(async () => {
    const menus = await listAll(COL.menus, { orderBy: "date", dir: "desc" });
    return json(menus.map((m) => ({ ...m, date: m.date, createdAt: m.createdAt })));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const menu = await create(COL.menus, {
      date: body.date,
      title: body.title ?? null,
      titleEs: body.titleEs ?? null,
      published: body.published ?? false,
      note: body.note ?? body.notes ?? null,
      noteEs: body.noteEs ?? null,
    });
    if (Array.isArray(body.sections)) await saveMenuSections(menu.id, body.sections);
    return json(await getMenuWithItems(menu.id), 201);
  });
