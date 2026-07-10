/**
 * Site settings — business info + business hours, editable from /admin/settings.
 * Stored as a single document (COL.settings, id = SETTINGS_ID) so the schema
 * can grow without a migration.
 */
import { COL, getById, update, setWithId } from "./store";
import type { Lang } from "@/i18n/utils";

export const SETTINGS_ID = 1;

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DayHours {
  closed: boolean;
  open: string;  // "HH:MM", 24-hour — meaningful only when closed is false
  close: string; // "HH:MM", 24-hour
}

export type BusinessHours = Record<DayKey, DayHours>;

export const DAY_ORDER: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const OPEN: DayHours = { closed: false, open: "07:30", close: "17:30" };
const CLOSED: DayHours = { closed: true, open: "09:00", close: "17:00" };

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { ...OPEN },
  tuesday: { ...OPEN },
  wednesday: { ...OPEN },
  thursday: { ...OPEN },
  friday: { ...OPEN },
  saturday: { ...CLOSED },
  sunday: { ...CLOSED },
};

export interface SiteSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  businessHours: BusinessHours;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  bakesyUrl: string;
  googleMapsUrl: string;
  metaTitle: string;
  metaDescription: string;
  announcementBanner: string;
  bannerEnabled: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "Pavlova Love Tampa",
  phone: "(407) 419-7137",
  email: "hello@pavlovalovetampa.com",
  address: "3909 W Broad St, Tampa, FL 33614",
  businessHours: DEFAULT_BUSINESS_HOURS,
  instagramUrl: "https://www.instagram.com/pavlovalovetampa/",
  facebookUrl: "https://www.facebook.com/p/Pavlovalovetampa-100064058713044/",
  whatsappNumber: "+14074197137",
  bakesyUrl: "https://bakesy.shop",
  googleMapsUrl: "https://maps.google.com/?q=3909+W+Broad+St+Tampa+FL+33614",
  metaTitle: "",
  metaDescription: "",
  announcementBanner: "",
  bannerEnabled: false,
};

function sanitizeDayHours(input: any, fallback: DayHours): DayHours {
  if (!input || typeof input !== "object") return fallback;
  return {
    closed: Boolean(input.closed),
    open: typeof input.open === "string" && input.open ? input.open : fallback.open,
    close: typeof input.close === "string" && input.close ? input.close : fallback.close,
  };
}

/** Defensively merges arbitrary stored/submitted data onto the defaults so a
 *  missing day (or a fresh install with no row yet) never breaks rendering. */
export function sanitizeBusinessHours(input: any): BusinessHours {
  const source = input && typeof input === "object" ? input : {};
  const result = {} as BusinessHours;
  for (const day of DAY_ORDER) {
    result[day] = sanitizeDayHours(source[day], DEFAULT_BUSINESS_HOURS[day]);
  }
  return result;
}

function sanitizeSettings(row: any): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...row,
    businessHours: sanitizeBusinessHours(row?.businessHours),
  };
}

/** Reads site settings, applying defaults for any missing field. Never throws —
 *  callers (including the public footer, rendered on every page) always get a
 *  usable object even if the DB is unreachable or no row exists yet. */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const row = await getById(COL.settings, SETTINGS_ID);
    return sanitizeSettings(row);
  } catch (err) {
    console.warn("[settings] Failed to load settings, using defaults:", (err as Error)?.message);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch: Record<string, any>): Promise<SiteSettings> {
  const clean: Record<string, any> = { ...patch };
  if ("businessHours" in patch) clean.businessHours = sanitizeBusinessHours(patch.businessHours);

  const existing = await getById(COL.settings, SETTINGS_ID);
  if (!existing) {
    const created = await setWithId(COL.settings, SETTINGS_ID, { ...DEFAULT_SETTINGS, ...clean, id: SETTINGS_ID });
    return sanitizeSettings(created);
  }
  const updated = await update(COL.settings, SETTINGS_ID, clean);
  return sanitizeSettings(updated);
}

const DAY_LABELS: Record<Lang, { full: Record<DayKey, string>; abbr: Record<DayKey, string> }> = {
  en: {
    full: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" },
    abbr: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
  },
  es: {
    full: { monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles", thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo" },
    abbr: { monday: "Lun", tuesday: "Mar", wednesday: "Mié", thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom" },
  },
};

function formatTime12(time: string): string {
  const [hStr, mStr = "00"] = time.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr.padStart(2, "0")} ${period}`;
}

interface DayGroup {
  days: DayKey[];
  closed: boolean;
  open: string;
  close: string;
}

function groupConsecutiveDays(hours: BusinessHours): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const day of DAY_ORDER) {
    const h = hours[day];
    const last = groups[groups.length - 1];
    if (last && last.closed === h.closed && last.open === h.open && last.close === h.close) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], closed: h.closed, open: h.open, close: h.close });
    }
  }
  return groups;
}

/** One display line per group of consecutive days sharing the same hours,
 *  e.g. ["Mon – Fri: 7:30 am – 5:30 pm", "Sat – Sun: Closed"]. */
export function formatBusinessHours(hours: BusinessHours, lang: Lang): string[] {
  const labels = DAY_LABELS[lang] ?? DAY_LABELS.en;
  const closedWord = lang === "es" ? "Cerrado" : "Closed";
  return groupConsecutiveDays(hours).map((g) => {
    const dayLabel = g.days.length === 1
      ? labels.full[g.days[0]]
      : `${labels.abbr[g.days[0]]} – ${labels.abbr[g.days[g.days.length - 1]]}`;
    const timeLabel = g.closed ? closedWord : `${formatTime12(g.open)} – ${formatTime12(g.close)}`;
    return `${dayLabel}: ${timeLabel}`;
  });
}
