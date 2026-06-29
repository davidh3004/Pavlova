import type { APIRoute } from "astro";
import { json, error, readBody, run } from "@/server/http";
import { findAdminByUsername, hashPassword, setSessionCookie, publicAdmin } from "@/server/auth";

export const POST: APIRoute = ({ request, cookies }) =>
  run(async () => {
    const body = await readBody(request);
    if (!body.username || !body.password) return error("Invalid credentials", 401);

    const user = await findAdminByUsername(body.username);
    if (!user || user.passwordHash !== hashPassword(body.password)) {
      return error("Invalid credentials", 401);
    }

    setSessionCookie(cookies, user.id);
    return json({ success: true, user: publicAdmin(user) });
  });
