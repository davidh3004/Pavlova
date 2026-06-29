import type { APIRoute } from "astro";
import { COL, update } from "@/server/store";
import { json, error, readBody, run, toNumber } from "@/server/http";

const applyUpdate: APIRoute = ({ params, request }) =>
  run(async () => {
    const id = toNumber(params.id);
    const body = await readBody(request);
    const patch: Record<string, any> = {};
    if (body.status !== undefined) patch.status = body.status;
    if (body.notes !== undefined) patch.notes = body.notes;
    const inquiry = await update(COL.cateringInquiries, id, patch);
    if (!inquiry) return error("Not found", 404);
    return json({ ...inquiry, createdAt: inquiry.createdAt });
  });

export const PUT = applyUpdate;
export const PATCH = applyUpdate;
