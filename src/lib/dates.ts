/** Business timezone — Tampa, FL */
export const BUSINESS_TIMEZONE = "America/New_York";

/** YYYY-MM-DD for "today" in the business timezone (not UTC). */
export function todayDateString(timeZone = BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
