import { MEDIA_DIR, serveFile } from "@/lib/storage";

export async function GET(req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path } = await ctx.params;
  return serveFile(req, MEDIA_DIR, path.join("/"), { "Cache-Control": "public, max-age=604800" });
}
