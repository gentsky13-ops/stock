import { NextResponse } from "next/server";
import path from "node:path";
import { getCurrentUser, safeEqual } from "@/lib/auth";
import { getPurchaseItem } from "@/lib/orders";
import { getProductById, getProductFiles, slugify } from "@/lib/products";
import { FILES_DIR, serveFile } from "@/lib/storage";

export async function GET(req: Request, ctx: RouteContext<"/api/download/[itemId]">) {
  const { itemId } = await ctx.params;
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "pr" ? "pr" : "ae";
  const key = url.searchParams.get("key") ?? "";

  const item = getPurchaseItem(Number(itemId));
  if (!item || item.status !== "paid") return new NextResponse("Not found", { status: 404 });
  const user = await getCurrentUser();
  const allowed = (user && item.user_id === user.id) || (key && safeEqual(key, item.access_key));
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  if (item.format !== "both" && item.format !== kind) return new NextResponse("Not part of this purchase", { status: 403 });

  const files = getProductFiles(item.product_id);
  const loc = files?.[kind];
  if (!loc) return new NextResponse("File is not available yet — please contact support.", { status: 404 });
  if (/^https?:\/\//.test(loc)) return NextResponse.redirect(loc);

  const product = getProductById(item.product_id);
  const name = `${slugify(product?.title ?? "project")}-${kind === "ae" ? "after-effects" : "premiere-pro"}${path.extname(loc) || ".zip"}`;
  return serveFile(req, FILES_DIR, loc, {
    "Content-Disposition": `attachment; filename="${name}"`,
    "Cache-Control": "private, no-store",
  });
}
