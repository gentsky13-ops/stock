import { createProduct } from "@/lib/products";
import { bad, parseProduct, requireAdmin } from "./_shared";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return bad("Forbidden", 403);
  try {
    const parsed = await parseProduct(await req.formData(), null);
    if ("error" in parsed) return bad(parsed.error);
    return Response.json({ id: createProduct(parsed.input) });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Could not save project.", 500);
  }
}
