import { NextResponse } from "next/server";
import { appUrl } from "@/lib/auth";
import { finalizeOrder } from "@/lib/checkout";
import { getOrder } from "@/lib/orders";
import { isStripeSessionPaid } from "@/lib/payments";

/** Stripe success redirect: verify the session server-side before granting access. */
export async function GET(req: Request) {
  const base = appUrl(req);
  const url = new URL(req.url);
  const order = getOrder(Number(url.searchParams.get("order")));
  const sessionId = url.searchParams.get("session_id") ?? "";
  if (!order || order.provider !== "stripe" || order.provider_ref !== sessionId) {
    return NextResponse.redirect(`${base}/checkout?error=payment`);
  }
  if (order.status !== "paid") {
    const paid = await isStripeSessionPaid(sessionId, order.id, order.total).catch(() => false);
    if (!paid) return NextResponse.redirect(`${base}/checkout?error=payment`);
    await finalizeOrder(order.id, base);
  }
  return NextResponse.redirect(`${base}/order/${order.id}?key=${order.access_key}`);
}
