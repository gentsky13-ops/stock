// Pure pricing rules used by both the cart UI and the server checkout.
import { BUNDLE_DISCOUNTS, LICENSES, type LicenseCode } from "./config";
import type { Format, Product } from "./types";

type PriceFields = Pick<Product, "hasAe" | "hasPr" | "priceAe" | "pricePr" | "priceBoth" | "salePercent">;

export function availableFormats(p: Pick<Product, "hasAe" | "hasPr">): Format[] {
  const out: Format[] = [];
  if (p.hasAe) out.push("ae");
  if (p.hasPr) out.push("pr");
  if (p.hasAe && p.hasPr) out.push("both");
  return out;
}

export function defaultFormat(p: Pick<Product, "hasAe" | "hasPr">): Format {
  return p.hasAe ? "ae" : "pr";
}

export function formatPrice(p: PriceFields, format: Format): number {
  if (format === "ae") return p.priceAe ?? 0;
  if (format === "pr") return p.pricePr ?? 0;
  if (p.priceBoth) return p.priceBoth;
  return Math.round(((p.priceAe ?? 0) + (p.pricePr ?? 0)) * 0.75);
}

/** Price before the sale discount. */
export function listPrice(p: PriceFields, format: Format, license: LicenseCode): number {
  return Math.round(formatPrice(p, format) * LICENSES[license].multiplier);
}

export function unitPrice(p: PriceFields, format: Format, license: LicenseCode): number {
  const base = listPrice(p, format, license);
  return p.salePercent > 0 ? Math.round((base * (100 - p.salePercent)) / 100) : base;
}

/** Cheapest standard price shown on cards. */
export function startingPrice(p: PriceFields) {
  const f = p.hasAe && p.hasPr ? (Math.min(p.priceAe ?? 0, p.pricePr ?? 0) === p.priceAe ? "ae" : "pr") : defaultFormat(p);
  return { list: listPrice(p, f, "standard"), final: unitPrice(p, f, "standard") };
}

export interface PricedLine<T> {
  item: T;
  unit: number;
  discountPercent: number;
  discount: number;
  total: number;
}

/**
 * Most expensive item is full price, the 2nd gets 15% off, the 3rd and every
 * following item get 20% off — so discounts always land on the cheaper items.
 */
export function applyBundleDiscounts<T>(items: { item: T; unit: number }[]) {
  const ranked = [...items].map((x, i) => ({ ...x, i })).sort((a, b) => b.unit - a.unit || a.i - b.i);
  const pct = new Map<number, number>();
  ranked.forEach((x, rank) => pct.set(x.i, rank === 0 ? 0 : rank === 1 ? BUNDLE_DISCOUNTS.second : BUNDLE_DISCOUNTS.thirdPlus));
  const lines: PricedLine<T>[] = items.map((x, i) => {
    const discountPercent = pct.get(i) ?? 0;
    const discount = Math.round((x.unit * discountPercent) / 100);
    return { item: x.item, unit: x.unit, discountPercent, discount, total: x.unit - discount };
  });
  const subtotal = lines.reduce((s, l) => s + l.unit, 0);
  const discount = lines.reduce((s, l) => s + l.discount, 0);
  return { lines, subtotal, discount, total: subtotal - discount };
}

/** Discount the next item added to a cart of `count` items would receive. */
export function nextItemDiscount(count: number) {
  return count === 0 ? 0 : count === 1 ? BUNDLE_DISCOUNTS.second : BUNDLE_DISCOUNTS.thirdPlus;
}

export function money(cents: number) {
  const v = cents / 100;
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

export const FORMAT_LABEL: Record<Format, string> = {
  ae: "After Effects",
  pr: "Premiere Pro",
  both: "After Effects + Premiere Pro",
};
