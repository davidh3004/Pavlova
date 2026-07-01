import type { APIRoute } from "astro";
import { json } from "@/server/http";
import { getSquarePublicConfig } from "@/server/square";

export const GET: APIRoute = () => json(getSquarePublicConfig());
