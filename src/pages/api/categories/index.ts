import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const GET: APIRoute = () =>
  run(async () => json(await listAll(COL.categories, { orderBy: "sortOrder", dir: "asc" })));

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const category = await create(COL.categories, {
      name: body.name,
      nameEs: body.nameEs ?? "",
      slug: body.slug ?? null,
      sortOrder: body.sortOrder ?? 0,
    });
    return json(category, 201);
  });
