import "server-only";
import { db, nowIso } from "./db";
import { syncDailyReviews } from "./reviews";
import type { Product } from "./types";

type Row = Record<string, unknown>;

const json = <T,>(v: unknown, fallback: T): T => {
  try {
    return v ? (JSON.parse(String(v)) as T) : fallback;
  } catch {
    return fallback;
  }
};

const SELECT = `
SELECT p.*, COALESCE(r.cnt, 0) AS review_count, COALESCE(r.avg, 0) AS rating
FROM products p
LEFT JOIN (SELECT product_id, COUNT(*) cnt, AVG(rating) avg FROM reviews GROUP BY product_id) r ON r.product_id = p.id`;

export function mapProduct(r: Row): Product {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    title: String(r.title),
    tagline: String(r.tagline ?? ""),
    description: String(r.description ?? ""),
    hasAe: !!r.has_ae,
    hasPr: !!r.has_pr,
    motionbro: !!r.motionbro,
    autoresize: !!r.autoresize,
    featured: !!r.featured,
    featuredOrder: Number(r.featured_order ?? 0),
    priceAe: r.price_ae == null ? null : Number(r.price_ae),
    pricePr: r.price_pr == null ? null : Number(r.price_pr),
    priceBoth: r.price_both == null ? null : Number(r.price_both),
    salePercent: Number(r.sale_percent ?? 0),
    tags: json(r.tags, []),
    filesIncluded: json(r.files_included, []),
    sizeLabel: String(r.size_label ?? ""),
    resolution: String(r.resolution ?? ""),
    elementsCount: r.elements_count == null ? null : Number(r.elements_count),
    customFeatures: json(r.custom_features, []),
    categories: json(r.categories, []),
    scenes: json(r.scenes, []),
    previewImage: String(r.preview_image ?? ""),
    previewVideo: String(r.preview_video ?? ""),
    createdAt: String(r.created_at),
    sales: Number(r.sales ?? 0),
    rating: Math.round(Number(r.rating ?? 0) * 10) / 10,
    reviewCount: Number(r.review_count ?? 0),
  };
}

export function listProducts(): Product[] {
  syncDailyReviews();
  const rows = db().prepare(`${SELECT} ORDER BY p.created_at DESC`).all() as Row[];
  return rows.map(mapProduct);
}

export function getProductBySlug(slug: string): Product | null {
  syncDailyReviews();
  const r = db().prepare(`${SELECT} WHERE p.slug = ?`).get(slug) as Row | undefined;
  return r ? mapProduct(r) : null;
}

export function getProductById(id: number): Product | null {
  const r = db().prepare(`${SELECT} WHERE p.id = ?`).get(id) as Row | undefined;
  return r ? mapProduct(r) : null;
}

/** Server-only download locations. */
export function getProductFiles(id: number): { ae: string; pr: string } | null {
  const r = db().prepare("SELECT file_ae, file_pr FROM products WHERE id = ?").get(id) as Row | undefined;
  return r ? { ae: String(r.file_ae ?? ""), pr: String(r.file_pr ?? "") } : null;
}

export function featuredProducts(all: Product[]) {
  return all
    .filter((p) => p.featured)
    .sort((a, b) => a.featuredOrder - b.featuredOrder)
    .slice(0, 5);
}

export function popularTags(all: Product[], limit = 12) {
  const counts = new Map<string, number>();
  for (const p of all) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([t]) => t);
}

export function relatedProducts(p: Product, all: Product[], limit = 4) {
  const score = (o: Product) =>
    o.tags.filter((t) => p.tags.includes(t)).length * 2 + (o.hasAe === p.hasAe ? 1 : 0) + (o.hasPr === p.hasPr ? 1 : 0);
  return all
    .filter((o) => o.id !== p.id)
    .sort((a, b) => score(b) - score(a) || b.sales - a.sales)
    .slice(0, limit);
}

export interface ProductInput {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  hasAe: boolean;
  hasPr: boolean;
  motionbro: boolean;
  autoresize: boolean;
  featured: boolean;
  featuredOrder: number;
  priceAe: number | null;
  pricePr: number | null;
  priceBoth: number | null;
  salePercent: number;
  tags: string[];
  filesIncluded: string[];
  sizeLabel: string;
  resolution: string;
  elementsCount: number | null;
  customFeatures: Product["customFeatures"];
  categories: Product["categories"];
  scenes: Product["scenes"];
  previewImage: string;
  previewVideo: string;
  fileAe: string;
  filePr: string;
  /** Defaults to now. Reviews start accruing the day after creation. */
  createdAt?: string;
  sales?: number;
}

function toParams(p: ProductInput) {
  return {
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    description: p.description,
    has_ae: p.hasAe ? 1 : 0,
    has_pr: p.hasPr ? 1 : 0,
    motionbro: p.motionbro ? 1 : 0,
    autoresize: p.autoresize ? 1 : 0,
    featured: p.featured ? 1 : 0,
    featured_order: p.featuredOrder,
    price_ae: p.hasAe ? p.priceAe : null,
    price_pr: p.hasPr ? p.pricePr : null,
    price_both: p.hasAe && p.hasPr ? p.priceBoth : null,
    sale_percent: p.salePercent,
    tags: JSON.stringify(p.tags),
    files_included: JSON.stringify(p.filesIncluded),
    size_label: p.sizeLabel,
    resolution: p.resolution,
    elements_count: p.elementsCount,
    custom_features: JSON.stringify(p.customFeatures),
    categories: JSON.stringify(p.categories),
    scenes: JSON.stringify(p.scenes),
    preview_image: p.previewImage,
    preview_video: p.previewVideo,
    file_ae: p.fileAe,
    file_pr: p.filePr,
  };
}

export function createProduct(p: ProductInput): number {
  const params = toParams(p);
  const created = p.createdAt ?? nowIso();
  const cols = Object.keys(params);
  const res = db()
    .prepare(
      `INSERT INTO products (${cols.join(",")}, created_at, review_seed_date, sales)
       VALUES (${cols.map((c) => "@" + c).join(",")}, @created_at, @seed, @sales)`,
    )
    .run({ ...params, created_at: created, seed: created.slice(0, 10), sales: p.sales ?? 0 });
  return Number(res.lastInsertRowid);
}

export function updateProduct(id: number, p: ProductInput) {
  const params = toParams(p);
  const cols = Object.keys(params);
  db()
    .prepare(`UPDATE products SET ${cols.map((c) => `${c} = @${c}`).join(", ")} WHERE id = @id`)
    .run({ ...params, id });
}

export function getProductInput(id: number): (ProductInput & { id: number }) | null {
  const r = db().prepare("SELECT * FROM products WHERE id = ?").get(id) as Row | undefined;
  if (!r) return null;
  const p = mapProduct({ ...r, rating: 0, review_count: 0 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rating: _r, reviewCount: _c, sales: _s, ...rest } = p;
  return { ...rest, fileAe: String(r.file_ae ?? ""), filePr: String(r.file_pr ?? "") };
}

export function deleteProduct(id: number) {
  const d = db();
  const sold = d.prepare("SELECT COUNT(*) c FROM order_items WHERE product_id = ?").get(id) as { c: number };
  if (sold.c > 0) throw new Error("This project has been purchased and can't be deleted (buyers keep access).");
  d.prepare("DELETE FROM reviews WHERE product_id = ?").run(id);
  d.prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
