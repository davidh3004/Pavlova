import type { APIRoute } from "astro";
import { COL, getById, setWithId, update } from "@/server/store";
import { json, readBody, run } from "@/server/http";

const SETTINGS_ID = 1;

const DEFAULTS = {
  id: SETTINGS_ID,
  businessName: "Pavlova Love Tampa",
  address: "3909 W Broad St, Tampa, FL 33614",
  phone: "(407) 419-7137",
  email: "hello@pavlovalovetampa.com",
  hours: null,
  instagram: "https://www.instagram.com/pavlovalovetampa/",
  facebook: "https://www.facebook.com/p/Pavlovalovetampa-100064058713044/",
  tiktok: "https://www.tiktok.com/@pavlovalovetampa0",
  whatsapp: "+14074197137",
  bakesy: "https://bakesy.shop",
};

export const GET: APIRoute = () =>
  run(async () => {
    const existing = await getById(COL.settings, SETTINGS_ID);
    if (existing) return json(existing);
    return json(DEFAULTS);
  });

export const PUT: APIRoute = ({ request }) =>
  run(async () => {
    const body = await readBody(request);
    const existing = await getById(COL.settings, SETTINGS_ID);
    if (!existing) {
      const created = await setWithId(COL.settings, SETTINGS_ID, { ...DEFAULTS, ...body, id: SETTINGS_ID });
      return json(created);
    }
    const updated = await update(COL.settings, SETTINGS_ID, body);
    return json(updated);
  });
