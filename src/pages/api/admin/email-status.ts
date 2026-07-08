import type { APIRoute } from "astro";
import { json, error, run } from "@/server/http";
import { getAdminId } from "@/server/auth";
import { isEmailConfigured } from "@/server/email";
import { COL, getById } from "@/server/store";

export const GET: APIRoute = ({ cookies }) =>
  run(async () => {
    if (!getAdminId(cookies)) return error("Not authenticated", 401);

    const notifyFromEnv = process.env.NOTIFY_EMAIL ?? "";
    let notifyFromSettings = "";
    try {
      const settings = await getById(COL.settings, 1);
      notifyFromSettings = settings?.email ?? "";
    } catch {
      /* ignore */
    }

    return json({
      configured: isEmailConfigured(),
      notifyEmail: notifyFromEnv || notifyFromSettings || "hello@pavlovalovetampa.com",
      notifySource: notifyFromEnv ? "NOTIFY_EMAIL env" : notifyFromSettings ? "Site settings email" : "Default",
    });
  });
