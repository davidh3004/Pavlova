import type { APIRoute } from "astro";
import { clearSessionCookie } from "@/server/auth";

/** GET so it can be a plain <a href> link; POST also supported. */
export const GET: APIRoute = ({ cookies, redirect }) => {
  clearSessionCookie(cookies);
  return redirect("/admin");
};

export const POST: APIRoute = ({ cookies }) => {
  clearSessionCookie(cookies);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
