/**
 * Order SMS via Twilio (transactional only).
 *
 * Env:
 *   TWILIO_ACCOUNT_SID   — Twilio account SID
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_PHONE_NUMBER  — your Twilio number, e.g. +18135550100
 */
function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function isSmsConfigured(): boolean {
  return Boolean(
    env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_PHONE_NUMBER"),
  );
}

/** US numbers: 10 digits → +1XXXXXXXXXX */
export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 11) return `+${digits}`;
  return null;
}

async function sendSms(to: string, body: string): Promise<void> {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_PHONE_NUMBER");
  if (!accountSid || !authToken || !from) {
    console.warn("[sms] Twilio not configured — skipping send");
    return;
  }

  const recipient = toE164(to);
  if (!recipient) throw new Error(`Invalid phone number: ${to}`);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: recipient, From: from, Body: body }).toString(),
    },
  );

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message || `Twilio HTTP ${res.status}`);
  }
}

/** Fire-and-forget — never blocks or fails the caller. */
export function sendSmsSafe(fn: () => Promise<void>): void {
  fn().catch((err) => console.error("[sms]", err));
}

export async function notifyOrderSmsConfirmation(order: {
  id: number;
  orderNumber?: string;
  customerPhone?: string;
  pickupTime?: string | null;
}): Promise<void> {
  if (!order.customerPhone?.trim()) return;

  const label = order.orderNumber || `#${order.id}`;
  const pickup = order.pickupTime ? ` Pickup: ${order.pickupTime}.` : " We'll text when it's ready.";
  const body = `Pavlova Love Tampa: Order ${label} confirmed & paid.${pickup} 3909 W Broad St, Tampa.`;

  await sendSms(order.customerPhone, body.slice(0, 320));
}
