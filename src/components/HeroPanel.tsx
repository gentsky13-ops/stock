"use client";

import { ChevronRight, Maximize2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/config";
import type { Product } from "@/lib/types";
import { useCatalog, type CatalogFilters } from "./useCatalog";

function MenuPill({
  mark,
  title,
  sub,
  active,
  onClick,
}: {
  mark: React.ReactNode;
  title: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} data-active={active} className="pill group w-full !gap-3.5 py-2 pl-2 pr-5 text-left">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-black/30 text-[14px] font-semibold tracking-tight">
        {mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-tight">{title}</span>
        <span className="block text-[12px] text-ink-2">{sub}</span>
      </span>
      <ChevronRight size={16} className="text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink" />
    </button>
  );
}

export function HeroPanel({ products, tags }: { products: Product[]; tags: string[] }) {
  const { filters, setFilters } = useCatalog();
  const [q, setQ] = useState(filters.q);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with header search
  useEffect(() => setQ(filters.q), [filters.q]);

  const count = (f: (p: Product) => boolean) => products.filter(f).length;
  const only = (patch: Partial<CatalogFilters>) =>
    setFilters({ app: null, feature: null, sale: false, tag: null, ...patch }, { scroll: true });
  const saleCount = count((p) => p.salePercent > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="label">Template store</p>
        <p className="label">AE · PR · {products.length} projects</p>
      </div>

      <h1 className="mt-8 text-[clamp(2.2rem,3.6vw,3.6rem)] leading-[1.02] tracking-[-0.035em]">
        Motion templates.
        <br />
        <span className="text-ink-3">Pay once, own forever.</span>
      </h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-2">{SITE.intro}</p>

      <div className="mt-8 space-y-2.5">
        <MenuPill
          mark="Ae"
          title="After Effects"
          sub={`${count((p) => p.hasAe)} projects`}
          active={filters.app === "ae"}
          onClick={() => only({ app: filters.app === "ae" ? null : "ae" })}
        />
        <MenuPill
          mark="Pr"
          title="Premiere Pro"
          sub={`${count((p) => p.hasPr)} projects`}
          active={filters.app === "pr"}
          onClick={() => only({ app: filters.app === "pr" ? null : "pr" })}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button
          data-active={filters.feature === "motionbro"}
          onClick={() => only({ feature: filters.feature === "motionbro" ? null : "motionbro" })}
          className="pill justify-between px-4 py-2.5 text-[13px]"
        >
          <span className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#ffd2b0]">Mo</span> MotionBro plugin
          </span>
          <span className="text-ink-3">{count((p) => p.motionbro)}</span>
        </button>
        <button
          data-active={filters.feature === "autoresize"}
          onClick={() => only({ feature: filters.feature === "autoresize" ? null : "autoresize" })}
          className="pill justify-between px-4 py-2.5 text-[13px]"
        >
          <span className="flex items-center gap-2">
            <Maximize2 size={13} className="text-ink-2" /> Auto-resize
          </span>
          <span className="text-ink-3">{count((p) => p.autoresize)}</span>
        </button>
      </div>

      {saleCount > 0 && (
        <button
          onClick={() => only({ sale: !filters.sale })}
          className={`group mt-2.5 flex items-center justify-between rounded-full px-5 py-3 text-left text-black shadow-[0_18px_40px_-18px_rgba(255,138,92,.8)] transition hover:brightness-105 ${
            filters.sale ? "ring-2 ring-white/70" : ""
          }`}
          style={{ background: "linear-gradient(100deg,#ffb38a 0%,#ff8a5c 55%,#f0a08a 100%)" }}
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-black/80" />
            </span>
            <span className="text-[15px] font-medium">On sale today</span>
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em]">
            {saleCount} deals <ChevronRight size={13} className="inline -translate-y-px" />
          </span>
        </button>
      )}

      <div className="mt-auto pt-8">
        <p className="label !text-[10px]">Popular tags</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilters({ tag: filters.tag === t ? null : t }, { scroll: true })}
              className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition ${
                filters.tag === t ? "border-white/60 text-ink" : "border-white/12 text-ink-2 hover:border-white/30 hover:text-ink"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex items-center gap-2 border-b border-white/15 pb-2 focus-within:border-white/40"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ q: q.trim() }, { scroll: true });
          }}
          role="search"
        >
          <Search size={14} className="text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by keyword…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-3"
            aria-label="Search by keyword"
          />
          <button type="submit" className="label hover:text-ink">
            Go
          </button>
        </form>
      </div>
    </div>
  );
}
