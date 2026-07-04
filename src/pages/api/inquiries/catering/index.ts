import type { APIRoute } from "astro";
import { COL, listAll, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";
import { notifyCateringInquiry, sendEmailSafe } from "@/server/email";

export const GET: APIRoute = () =>
  run(async () => {
    const rows = await listAll(COL.cateringInquiries, { orderBy: "createdAt", dir: "desc" });
    return json(rows.map((i) => ({ ...i, createdAt: i.createdAt })));
  });

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const inquiry = await create(COL.cateringInquiries, {
      name: body.name ?? "",
      email: body.email ?? "",
      phone: body.phone ?? null,
      eventType: body.eventType ?? null,
      eventDate: body.eventDate ?? null,
      guestCount: body.guestCount ?? null,
      message: body.message ?? null,
      status: "new",
      notes: null,
    });
    sendEmailSafe(() => notifyCateringInquiry(inquiry));
    return json({ ...inquiry, createdAt: inquiry.createdAt }, 201);
  });
