import { deleteProduct, getProductById, updateProduct } from "@/lib/products";
import { bad, parseProduct, requireAdmin } from "../_shared";

export async function POST(req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  if (!(await requireAdmin())) return bad("Forbidden", 403);
  const id = Number((await ctx.params).id);
  if (!getProductById(id)) return bad("Project not found.", 404);
  try {
    const parsed = await parseProduct(await req.formData(), id);
    if ("error" in parsed) return bad(parsed.error);
    updateProduct(id, parsed.input);
    return Response.json({ id });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Could not save project.", 500);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  if (!(await requireAdmin())) return bad("Forbidden", 403);
  const id = Number((await ctx.params).id);
  try {
    deleteProduct(id);
    return Response.json({ ok: true });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Could not delete project.");
  }
}
