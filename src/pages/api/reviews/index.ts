import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const GET: APIRoute = ({ url }) =>
  run(async () => {
    let reviews = await listAll(COL.reviews, { orderBy: "sortOrder", dir: "asc" });
    if (url.searchParams.get("featured") === "true") {
      reviews = reviews.filter((r) => r.featured);
    }
    return json(reviews.map((r) => ({ ...r, createdAt: r.createdAt })));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const review = await create(COL.reviews, {
      author: body.author ?? body.name ?? "",
      rating: body.rating ?? 5,
      text: body.text ?? "",
      textEs: body.textEs ?? null,
      source: body.source ?? null,
      featured: body.featured ?? false,
      sortOrder: body.sortOrder ?? 0,
    });
    return json({ ...review, createdAt: review.createdAt }, 201);
  });
