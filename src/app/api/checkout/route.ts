import { NextResponse } from "next/server";
import { appUrl, getCurrentUser, normalizeEmail } from "@/lib/auth";
import { finalizeOrder } from "@/lib/checkout";
import { createOrder, quote, setOrderRef } from "@/lib/orders";
import { createStripeCheckout, stripeConfigured } from "@/lib/payments";
import { demoMode } from "@/lib/mail";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = await getCurrentUser();
  const email = user?.email ?? normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });

  let q;
  try {
    q = quote(body.items);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const base = appUrl(req);
  if (stripeConfigured()) {
    const { orderId } = createOrder(email, user?.id ?? null, q, "stripe");
    try {
      const session = await createStripeCheckout({ orderId, email, q, baseUrl: base });
      setOrderRef(orderId, session.id);
      return NextResponse.json({ url: session.url });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }

  // Demo mode (no payment provider configured): the order is paid instantly.
  if (!demoMode()) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }
  const { orderId, accessKey } = createOrder(email, user?.id ?? null, q, "demo");
  await finalizeOrder(orderId, base);
  return NextResponse.json({ url: `/order/${orderId}?key=${accessKey}` });
}
