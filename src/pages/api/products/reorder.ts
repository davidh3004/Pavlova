import type { APIRoute } from "astro";
import { COL, update } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const updates: { id: number; sortOrder?: number; featured?: boolean }[] = body.updates ?? [];
    await Promise.all(
      updates.map((u) => {
        const patch: Record<string, unknown> = {};
        if (u.sortOrder !== undefined) patch.sortOrder = u.sortOrder;
        if (u.featured !== undefined) patch.featured = u.featured;
        return update(COL.products, u.id, patch);
      })
    );
    return json({ ok: true, count: updates.length });
  });
