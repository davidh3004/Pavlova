import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const GET: APIRoute = ({ url }) =>
  run(async () => {
    let items = await listAll(COL.gallery, { orderBy: "sortOrder", dir: "asc" });
    const category = url.searchParams.get("category");
    if (category) items = items.filter((i) => i.category === category);
    return json(items.map((i) => ({ ...i, createdAt: i.createdAt })));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const item = await create(COL.gallery, {
      title: body.title ?? null,
      titleEs: body.titleEs ?? null,
      imageUrl: body.imageUrl ?? "",
      category: body.category ?? null,
      sortOrder: body.sortOrder ?? 0,
    });
    return json({ ...item, createdAt: item.createdAt }, 201);
  });
