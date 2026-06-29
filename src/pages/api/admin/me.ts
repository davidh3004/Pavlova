import type { APIRoute } from "astro";
import { json, error, run } from "@/server/http";
import { getAdminId, findAdminById, publicAdmin } from "@/server/auth";

export const GET: APIRoute = ({ cookies }) =>
  run(async () => {
    const uid = getAdminId(cookies);
    if (!uid) return error("Not authenticated", 401);
    const user = await findAdminById(uid);
    if (!user) return error("User not found", 401);
    return json(publicAdmin(user));
  });
