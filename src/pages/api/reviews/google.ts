import type { APIRoute } from "astro";
import { json } from "@/server/http";
import { fetchGoogleReviews, isGoogleReviewsConfigured } from "@/server/googleReviews";

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(Number(url.searchParams.get("limit")) || 5, 10);
  if (!isGoogleReviewsConfigured()) {
    return json({ configured: false, reviews: [] });
  }
  const data = await fetchGoogleReviews(limit);
  return json({ configured: true, ...data });
};
