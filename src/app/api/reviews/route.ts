import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/orders";
import { upsertCustomerReview } from "@/lib/reviews";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to leave a review." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const productId = Number(body.productId);
  const rating = Number(body.rating);
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Pick a rating from 1 to 5 stars." }, { status: 400 });
  }
  if (!hasPurchased(user.id, productId)) {
    return NextResponse.json({ error: "Only buyers can review this project." }, { status: 403 });
  }
  const base = user.name?.trim() || user.email.split("@")[0];
  const [first, ...rest] = base.split(/\s+/);
  const author = rest.length ? `${first} ${rest[rest.length - 1].charAt(0).toUpperCase()}.` : first;
  upsertCustomerReview(productId, user.id, author, rating, text);
  return NextResponse.json({ ok: true });
}
