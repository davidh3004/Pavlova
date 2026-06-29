import type { APIRoute } from "astro";
import { json } from "@/server/http";
import { SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID, SQUARE_ENVIRONMENT } from "@/server/square";

export const GET: APIRoute = () =>
  json({
    applicationId: SQUARE_APPLICATION_ID,
    locationId: SQUARE_LOCATION_ID,
    environment: SQUARE_ENVIRONMENT,
    configured: Boolean(SQUARE_APPLICATION_ID && SQUARE_LOCATION_ID),
  });
