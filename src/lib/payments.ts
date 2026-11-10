import "server-only";
import { LICENSES } from "./config";
import { FORMAT_LABEL } from "./pricing";
import type { quote } from "./orders";

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

async function stripe(path: string, init?: { method?: string; body?: URLSearchParams }) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: init?.body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Payment provider error");
  return data;
}

/** Creates a Stripe Checkout Session with already-discounted line amounts. */
export async function createStripeCheckout(opts: {
  orderId: number;
  email: string;
  q: ReturnType<typeof quote>;
  baseUrl: string;
}) {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("customer_email", opts.email);
  body.set("client_reference_id", String(opts.orderId));
  body.set("success_url", `${opts.baseUrl}/api/checkout/complete?order=${opts.orderId}&session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${opts.baseUrl}/checkout`);
  opts.q.lines.forEach((l, i) => {
    body.set(`line_items[${i}][quantity]`, "1");
    body.set(`line_items[${i}][price_data][currency]`, "usd");
    body.set(`line_items[${i}][price_data][unit_amount]`, String(l.total));
    body.set(`line_items[${i}][price_data][product_data][name]`, l.product.title);
    body.set(
      `line_items[${i}][price_data][product_data][description]`,
      `${FORMAT_LABEL[l.format]} · ${LICENSES[l.license].label} license${l.discountPercent ? ` · ${l.discountPercent}% bundle discount` : ""}`,
    );
  });
  const session = await stripe("/checkout/sessions", { method: "POST", body });
  return { id: String(session.id), url: String(session.url) };
}

export async function isStripeSessionPaid(sessionId: string, orderId: number, amount: number) {
  const s = await stripe(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
  return s.payment_status === "paid" && String(s.client_reference_id) === String(orderId) && s.amount_total === amount;
}
