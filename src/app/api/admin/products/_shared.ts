import "server-only";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { listProducts, slugify, type ProductInput } from "@/lib/products";
import { saveMedia, saveProjectFile } from "@/lib/storage";

export const bad = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function requireAdmin() {
  return isAdmin(await getCurrentUser());
}

const isFile = (v: FormDataEntryValue | null): v is File => typeof v === "object" && v !== null && v.size > 0;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)));

/** Builds a validated ProductInput from multipart form data, or returns an error message. */
export async function parseProduct(
  form: FormData,
  currentId: number | null,
): Promise<{ input: ProductInput } | { error: string }> {
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return { error: "Invalid form data." };
  }

  const title = str(d.title);
  if (!title) return { error: "Title is required." };
  const slug = slugify(str(d.slug) || title);
  if (!slug) return { error: "Slug is invalid." };
  if (listProducts().some((p) => p.slug === slug && p.id !== currentId)) {
    return { error: `Slug "${slug}" is already used by another project.` };
  }

  const hasAe = !!d.hasAe;
  const hasPr = !!d.hasPr;
  if (!hasAe && !hasPr) return { error: "Enable at least one format (After Effects or Premiere Pro)." };
  // Prices arrive as integer USD cents.
  const priceAe = num(d.priceAe);
  const pricePr = num(d.pricePr);
  const priceBoth = num(d.priceBoth);
  if (hasAe && (!priceAe || priceAe <= 0)) return { error: "Set an After Effects price above 0." };
  if (hasPr && (!pricePr || pricePr <= 0)) return { error: "Set a Premiere Pro price above 0." };
  if (hasAe && hasPr && priceBoth != null && priceBoth <= 0) return { error: "Bundle price must be above 0 (or blank)." };

  const salePercent = Math.round(Number(d.salePercent) || 0);
  if (salePercent < 0 || salePercent > 90) return { error: "Sale percent must be between 0 and 90." };
  const featured = !!d.featured;
  const featuredOrder = Math.round(Number(d.featuredOrder) || 0);
  if (featured && (featuredOrder < 1 || featuredOrder > 5)) return { error: "Featured order must be between 1 and 5." };

  const list = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
  const rawCats = (Array.isArray(d.categories) ? d.categories : []) as { name?: unknown; count?: unknown }[];
  const categories = rawCats
    .map((c) => ({ name: str(c?.name), count: Math.max(0, Math.round(Number(c?.count) || 0)) }))
    .filter((c) => c.name);
  const customFeatures = ((Array.isArray(d.customFeatures) ? d.customFeatures : []) as { title?: unknown; text?: unknown }[])
    .map((f) => ({ title: str(f?.title), text: str(f?.text) }))
    .filter((f) => f.title);

  // Kept scenes come back from the client (removed ones omitted); new uploads are appended per category index.
  const scenes = ((Array.isArray(d.scenes) ? d.scenes : []) as { image?: unknown; category?: unknown }[])
    .map((s) => ({ image: str(s?.image), category: str(s?.category) }))
    .filter((s) => s.image && categories.some((c) => c.name === s.category));
  for (let i = 0; i < rawCats.length; i++) {
    const name = str(rawCats[i]?.name);
    if (!name) continue;
    for (const f of form.getAll(`scene:${i}`)) {
      if (isFile(f)) scenes.push({ image: await saveMedia(f, "scene-"), category: name });
    }
  }

  const img = form.get("previewImage");
  const vid = form.get("previewVideo");
  const fa = form.get("fileAe");
  const fp = form.get("filePr");
  const previewImage = isFile(img) ? await saveMedia(img, "poster-") : str(d.previewImage);
  const previewVideo = isFile(vid) ? await saveMedia(vid, "video-") : str(d.previewVideo);
  const fileAe = hasAe ? (isFile(fa) ? await saveProjectFile(fa) : str(d.fileAe)) : "";
  const filePr = hasPr ? (isFile(fp) ? await saveProjectFile(fp) : str(d.filePr)) : "";
  for (const [label, v] of [["After Effects", fileAe], ["Premiere Pro", filePr]] as const) {
    if (/^[a-z]+:\/\//i.test(v) && !/^https?:\/\//i.test(v)) return { error: `${label} link must be an http(s) URL.` };
  }

  const elements = num(d.elementsCount);
  return {
    input: {
      slug,
      title,
      tagline: str(d.tagline),
      description: str(d.description),
      hasAe,
      hasPr,
      motionbro: !!d.motionbro,
      autoresize: !!d.autoresize,
      featured,
      featuredOrder: featured ? featuredOrder : 0,
      priceAe: hasAe ? priceAe : null,
      pricePr: hasPr ? pricePr : null,
      priceBoth: hasAe && hasPr ? priceBoth : null,
      salePercent,
      tags: list(d.tags),
      filesIncluded: list(d.filesIncluded),
      sizeLabel: str(d.sizeLabel),
      resolution: str(d.resolution),
      elementsCount: elements && elements > 0 ? elements : null,
      customFeatures,
      categories,
      scenes,
      previewImage,
      previewVideo,
      fileAe,
      filePr,
    },
  };
}
