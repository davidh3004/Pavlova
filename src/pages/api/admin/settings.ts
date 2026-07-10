import type { APIRoute } from "astro";
import { json, error, readBody, run } from "@/server/http";
import { getAdminId } from "@/server/auth";
import { getSettings, saveSettings } from "@/server/settings";

export const GET: APIRoute = ({ cookies }) =>
  run(async () => {
    if (!getAdminId(cookies)) return error("Not authenticated", 401);
    return json(await getSettings());
  });

export const PUT: APIRoute = ({ request, cookies }) =>
  run(async () => {
    if (!getAdminId(cookies)) return error("Not authenticated", 401);
    const body = await readBody(request);
    return json(await saveSettings(body));
  });
