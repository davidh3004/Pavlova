/**
 * Transactional email via Resend.
 *
 * Env:
 *   RESEND_API_KEY    — Resend API key
 *   RESEND_FROM_EMAIL — verified sender, e.g. Pavlova Love <orders@pavlovalovetampa.com>
 *   NOTIFY_EMAIL      — inbox for alerts (defaults to site settings email)
 */
import { Resend } from "resend";
import { COL, getById } from "./store";

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

let resendClient: Resend | null | undefined;

function getResend(): Resend | null {
  if (resendClient !== undefined) return resendClient;
  const key = env("RESEND_API_KEY");
  if (!key) {
    resendClient = null;
    return resendClient;
  }
  resendClient = new Resend(key);
  return resendClient;
}

export function isEmailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") && env("RESEND_FROM_EMAIL"));
}

async function getNotifyEmail(): Promise<string> {
  const fromEnv = env("NOTIFY_EMAIL");
  if (fromEnv) return fromEnv;
  try {
    const settings = await getById(COL.settings, 1);
    if (settings?.email) return settings.email;
  } catch {
    /* settings unavailable */
  }
  return "hello@pavlovalovetampa.com";
}

function getFromEmail(): string {
  return env("RESEND_FROM_EMAIL", "Pavlova Love Tampa <onboarding@resend.dev>");
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: unknown): string {
  if (value == null || value === "") return "";
  return `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0">${esc(value)}</td></tr>`;
}

function wrap(title: string, body: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;color:#333">
    <h2 style="color:#c0445f;font-weight:normal;margin:0 0 16px">${esc(title)}</h2>
    <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5">${body}</table>
  </div>`;
}

async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn("[email] Resend not configured — skipping send");
    return;
  }
  const { error } = await client.emails.send({
    from: getFromEmail(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });
  if (error) throw new Error(error.message);
}

/** Fire-and-forget — never blocks or fails the caller. */
export function sendEmailSafe(fn: () => Promise<void>): void {
  fn().catch((err) => console.error("[email]", err));
}

export async function notifyContactMessage(msg: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}): Promise<void> {
  const to = await getNotifyEmail();
  const body =
    row("Name", msg.name) +
    row("Email", msg.email) +
    row("Phone", msg.phone) +
    row("Subject", msg.subject) +
    `<tr><td colspan="2" style="padding:12px 0 6px;color:#666">Message</td></tr>
     <tr><td colspan="2" style="padding:0 0 12px;white-space:pre-wrap">${esc(msg.message)}</td></tr>`;

  await sendEmail({
    to,
    subject: `Contact form: ${msg.subject || msg.name}`,
    html: wrap("New contact message", body),
    replyTo: msg.email || undefined,
  });

  if (msg.email) {
    await sendEmail({
      to: msg.email,
      subject: "We received your message — Pavlova Love Tampa",
      html: `<p style="font-family:system-ui,sans-serif">Hi ${esc(msg.name)},</p>
        <p style="font-family:system-ui,sans-serif">Thank you for reaching out! We received your message and will get back to you soon.</p>
        <p style="font-family:system-ui,sans-serif;color:#666">— Pavlova Love Tampa</p>`,
    });
  }
}

export async function notifyCateringInquiry(inq: {
  name: string;
  email: string;
  phone?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  guestCount?: string | null;
  message?: string | null;
}): Promise<void> {
  const to = await getNotifyEmail();
  const body =
    row("Name", inq.name) +
    row("Email", inq.email) +
    row("Phone", inq.phone) +
    row("Event type", inq.eventType) +
    row("Event date", inq.eventDate) +
    row("Guests", inq.guestCount) +
    (inq.message
      ? `<tr><td colspan="2" style="padding:12px 0 6px;color:#666">Details</td></tr>
         <tr><td colspan="2" style="padding:0;white-space:pre-wrap">${esc(inq.message)}</td></tr>`
      : "");

  await sendEmail({
    to,
    subject: `Catering inquiry: ${inq.name}`,
    html: wrap("New catering inquiry", body),
    replyTo: inq.email || undefined,
  });

  if (inq.email) {
    await sendEmail({
      to: inq.email,
      subject: "Catering inquiry received — Pavlova Love Tampa",
      html: `<p style="font-family:system-ui,sans-serif">Hi ${esc(inq.name)},</p>
        <p style="font-family:system-ui,sans-serif">Thank you for your catering inquiry! Our team will contact you within 24 hours.</p>
        <p style="font-family:system-ui,sans-serif;color:#666">— Pavlova Love Tampa</p>`,
    });
  }
}

export async function notifyCustomOrderInquiry(inq: {
  name: string;
  email: string;
  phone?: string | null;
  occasion?: string | null;
  neededDate?: string | null;
  servings?: string | null;
  details?: string | null;
  budget?: string | null;
  dessertType?: string | null;
  size?: string | null;
  flavors?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
}): Promise<void> {
  const to = await getNotifyEmail();
  const body =
    row("Name", inq.name) +
    row("Email", inq.email) +
    row("Phone", inq.phone) +
    row("Dessert type", inq.dessertType ?? inq.occasion) +
    row("Size / servings", inq.size ?? inq.servings) +
    row("Needed by", inq.neededDate) +
    row("Occasion", inq.occasion) +
    row("Budget", inq.budget) +
    (inq.flavors
      ? `<tr><td colspan="2" style="padding:12px 0 6px;color:#666">Flavors & preferences</td></tr>
         <tr><td colspan="2" style="padding:0;white-space:pre-wrap">${esc(inq.flavors)}</td></tr>`
      : "") +
    (inq.details
      ? `<tr><td colspan="2" style="padding:12px 0 6px;color:#666">Details</td></tr>
         <tr><td colspan="2" style="padding:0;white-space:pre-wrap">${esc(inq.details)}</td></tr>`
      : "") +
    (inq.notes
      ? `<tr><td colspan="2" style="padding:12px 0 6px;color:#666">Notes</td></tr>
         <tr><td colspan="2" style="padding:0;white-space:pre-wrap">${esc(inq.notes)}</td></tr>`
      : "") +
    row("Inspiration image", inq.imageUrl);

  await sendEmail({
    to,
    subject: `Custom order request: ${inq.name}`,
    html: wrap("New custom dessert inquiry", body),
    replyTo: inq.email || undefined,
  });

  if (inq.email) {
    await sendEmail({
      to: inq.email,
      subject: "Custom order request received — Pavlova Love Tampa",
      html: `<p style="font-family:system-ui,sans-serif">Hi ${esc(inq.name)},</p>
        <p style="font-family:system-ui,sans-serif">We received your custom order request and will follow up with you shortly.</p>
        <p style="font-family:system-ui,sans-serif;color:#666">— Pavlova Love Tampa</p>`,
    });
  }
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function notifyNewOrder(
  order: {
    id: number;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string | null;
    pickupTime?: string | null;
    paymentMethod?: string | null;
    totalAmount?: number;
    total?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
  },
  opts?: { paid?: boolean }
): Promise<void> {
  const to = await getNotifyEmail();
  const label = order.orderNumber || `#${order.id}`;
  const totalCents =
    order.totalAmount ?? Math.round(Number(order.total ?? 0));
  const itemsHtml = (order.items ?? [])
    .map(
      (i) =>
        `<li>${esc(i.quantity)}× ${esc(i.name)} — ${formatCents(Number(i.price) * Number(i.quantity))}</li>`
    )
    .join("");

  const body =
    row("Order", label) +
    row("Customer", order.customerName) +
    row("Phone", order.customerPhone) +
    row("Email", order.customerEmail) +
    row("Pickup", order.pickupTime) +
    row("Payment", order.paymentMethod) +
    row("Status", opts?.paid ? "Paid online" : "Awaiting pickup payment") +
    row("Total", formatCents(totalCents)) +
    (itemsHtml
      ? `<tr><td colspan="2" style="padding:12px 0 6px;color:#666">Items</td></tr>
         <tr><td colspan="2"><ul style="margin:0;padding-left:18px">${itemsHtml}</ul></td></tr>`
      : "");

  const title = opts?.paid ? "Order paid — new pickup order" : "New pickup order";
  await sendEmail({
    to,
    subject: `${title} ${label}`,
    html: wrap(title, body),
    replyTo: order.customerEmail || undefined,
  });
}

/** Customer receipt after placing a pickup order (optional — requires email). */
export async function notifyOrderConfirmation(
  order: {
    id: number;
    orderNumber?: string;
    customerName?: string;
    customerEmail?: string | null;
    pickupTime?: string | null;
    paymentMethod?: string | null;
    totalAmount?: number;
    total?: string;
    items?: Array<{ name: string; quantity: number; price: number }>;
  },
  opts?: { paid?: boolean },
): Promise<void> {
  if (!order.customerEmail) return;

  const label = order.orderNumber || `#${order.id}`;
  const totalCents = order.totalAmount ?? Math.round(Number(order.total ?? 0));
  const itemsHtml = (order.items ?? [])
    .map(
      (i) =>
        `<li>${esc(i.quantity)}× ${esc(i.name)} — ${formatCents(Number(i.price) * Number(i.quantity))}</li>`,
    )
    .join("");

  const body =
    `<p style="font-family:system-ui,sans-serif">Hi ${esc(order.customerName || "there")},</p>
     <p style="font-family:system-ui,sans-serif">Thank you for your order! We'll have it ready for pickup.</p>
     ${wrap("Order summary", row("Order", label) + row("Pickup", order.pickupTime) + row("Payment", order.paymentMethod) + row("Status", opts?.paid ? "Paid online" : "Pay at pickup") + row("Total", formatCents(totalCents)) + (itemsHtml ? `<tr><td colspan="2"><ul style="margin:8px 0 0;padding-left:18px">${itemsHtml}</ul></td></tr>` : ""))}
     <p style="font-family:system-ui,sans-serif;color:#666">— Pavlova Love Tampa<br>3909 W Broad St, Tampa, FL 33614</p>`;

  await sendEmail({
    to: order.customerEmail,
    subject: `Order confirmed ${label} — Pavlova Love Tampa`,
    html: body,
  });
}
