import type { APIRoute } from "astro";
import { COL, create } from "@/server/store";
import { json, readBody, run } from "@/server/http";

export const POST: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const message = await create(COL.contactMessages, {
      name: body.name ?? "",
      email: body.email ?? "",
      phone: body.phone ?? null,
      subject: body.subject ?? null,
      message: body.message ?? "",
      status: "new",
    });
    return json({ ...message, createdAt: message.createdAt }, 201);
  });
