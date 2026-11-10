"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import { startingPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { useCatalog } from "./useCatalog";

export function Catalog({ products }: { products: Product[] }) {
  const { filters, setFilters, active } = useCatalog();

  const list = useMemo(() => {
    const q = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = products.filter((p) => {
      if (filters.app === "ae" && !p.hasAe) return false;
      if (filters.app === "pr" && !p.hasPr) return false;
      if (filters.feature === "motionbro" && !p.motionbro) return false;
      if (filters.feature === "autoresize" && !p.autoresize) return false;
      if (filters.sale && p.salePercent <= 0) return false;
      if (filters.tag && !p.tags.includes(filters.tag)) return false;
      if (q.length) {
        const hay = [p.title, p.tagline, p.description, ...p.tags, ...p.categories.map((c) => c.name)].join(" ").toLowerCase();
        if (!q.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const by: Record<string, (a: Product, b: Product) => number> = {
      popular: (a, b) => b.sales - a.sales || b.reviewCount - a.reviewCount,
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      "price-asc": (a, b) => startingPrice(a).final - startingPrice(b).final,
      "price-desc": (a, b) => startingPrice(b).final - startingPrice(a).final,
    };
    return out.sort(by[filters.sort]);
  }, [products, filters]);

  const chips: { label: string; clear: () => void }[] = [];
  if (filters.app) chips.push({ label: filters.app === "ae" ? "After Effects" : "Premiere Pro", clear: () => setFilters({ app: null }) });
  if (filters.feature) chips.push({ label: filters.feature === "motionbro" ? "MotionBro" : "Auto-resize", clear: () => setFilters({ feature: null }) });
  if (filters.sale) chips.push({ label: "On sale", clear: () => setFilters({ sale: false }) });
  if (filters.tag) chips.push({ label: `#${filters.tag}`, clear: () => setFilters({ tag: null }) });
  if (filters.q) chips.push({ label: `“${filters.q}”`, clear: () => setFilters({ q: "" }) });

  return (
    <section id="catalog" className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{active ? "Filtered" : "All projects"}</p>
          <h2 className="mt-1.5 text-2xl tracking-tight">
            {list.length} {list.length === 1 ? "template" : "templates"}
          </h2>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((c) => (
              <button key={c.label} onClick={c.clear} className="pill px-3 py-1 text-[12px]">
                {c.label} <X size={12} className="text-ink-2" />
              </button>
            ))}
            <button
              onClick={() => setFilters({ app: null, feature: null, sale: false, tag: null, q: "" })}
              className="px-2 text-[12px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {list.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[28px] px-6 py-16 text-center text-ink-2">Nothing matches these filters yet.</div>
      )}
    </section>
  );
}
