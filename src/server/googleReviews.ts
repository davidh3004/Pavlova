/**
 * Google Business reviews via Places API (New).
 *
 * Env:
 *   GOOGLE_PLACES_API_KEY — API key with Places API enabled
 *   GOOGLE_PLACE_ID       — e.g. ChIJ... (find via Google Maps → Share → embed or Place ID finder)
 */

export interface GoogleReview {
  author: string;
  text: string;
  rating: number;
  relativeTime?: string;
  source: "Google";
}

export interface GoogleReviewsResult {
  reviews: GoogleReview[];
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

function env(key: string): string {
  return process.env[key] ?? "";
}

let cache: { at: number; data: GoogleReviewsResult } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isGoogleReviewsConfigured(): boolean {
  return Boolean(env("GOOGLE_PLACES_API_KEY") && env("GOOGLE_PLACE_ID"));
}

export async function fetchGoogleReviews(limit = 5): Promise<GoogleReviewsResult> {
  if (!isGoogleReviewsConfigured()) {
    return { reviews: [] };
  }

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return {
      ...cache.data,
      reviews: cache.data.reviews.slice(0, limit),
    };
  }

  const placeId = encodeURIComponent(env("GOOGLE_PLACE_ID"));
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env("GOOGLE_PLACES_API_KEY"),
        "X-Goog-FieldMask": "reviews,rating,userRatingCount,googleMapsUri",
      },
    });

    if (!res.ok) {
      console.error("[Google Reviews] API error:", res.status, await res.text().catch(() => ""));
      return { reviews: [] };
    }

    const data = await res.json();
    const reviews: GoogleReview[] = (data.reviews ?? []).map((r: any) => ({
      author: r.authorAttribution?.displayName ?? "Google User",
      text: r.text?.text ?? r.originalText?.text ?? "",
      rating: Number(r.rating) || 5,
      relativeTime: r.relativePublishTimeDescription,
      source: "Google" as const,
    }));

    const result: GoogleReviewsResult = {
      reviews,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      googleMapsUri: data.googleMapsUri,
    };

    cache = { at: Date.now(), data: result };
    return { ...result, reviews: reviews.slice(0, limit) };
  } catch (err) {
    console.error("[Google Reviews] Fetch failed:", err);
    return { reviews: [] };
  }
}
