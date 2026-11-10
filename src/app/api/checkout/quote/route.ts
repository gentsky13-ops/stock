import { NextResponse } from "next/server";
import { quote } from "@/lib/orders";
import { stripeConfigured } from "@/lib/payments";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const q = quote(body.items);
    return NextResponse.json({
      mode: stripeConfigured() ? "stripe" : "demo",
      subtotal: q.subtotal,
      discount: q.discount,
      total: q.total,
      lines: q.lines.map((l) => ({
        productId: l.product.id,
        slug: l.product.slug,
        title: l.product.title,
        image: l.product.previewImage,
        format: l.format,
        license: l.license,
        unit: l.unit,
        discountPercent: l.discountPercent,
        total: l.total,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, lines: [] }, { status: 400 });
  }
}
