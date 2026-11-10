"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Product, Scene } from "@/lib/types";

function Row({ scenes }: { scenes: Scene[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  if (!scenes.length) return null;
  return (
    <div className="group/row relative">
      <div
        ref={ref}
        className="no-scrollbar flex cursor-grab snap-x gap-3 overflow-x-auto active:cursor-grabbing"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !ref.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          ref.current.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        {scenes.map((s, i) => (
          <figure
            key={`${s.image}-${i}`}
            className="relative aspect-video w-[calc((100%-12px)/2)] shrink-0 snap-start overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/10 md:w-[calc((100%-48px)/5)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt={s.category} loading="lazy" draggable={false} className="h-full w-full object-cover" />
            <figcaption className="absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/80 backdrop-blur">
              {s.category}
            </figcaption>
          </figure>
        ))}
      </div>
      <button
        onClick={() => scroll(-1)}
        className="pill absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 justify-center !gap-0 opacity-0 transition group-hover/row:opacity-100 md:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => scroll(1)}
        className="pill absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 justify-center !gap-0 opacity-0 transition group-hover/row:opacity-100 md:flex"
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function IncludedSection({ product: p }: { product: Product }) {
  const [cat, setCat] = useState<string | null>(null);
  const total = p.categories.reduce((s, c) => s + c.count, 0);

  const rows = useMemo(() => {
    const list = cat ? p.scenes.filter((s) => s.category === cat) : p.scenes;
    const out: Scene[][] = [[], [], []];
    list.forEach((s, i) => out[i % 3].push(s));
    return out;
  }, [p.scenes, cat]);

  if (!p.categories.length && !p.scenes.length) return null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">What&apos;s included</p>
          <h2 className="mt-2 text-3xl tracking-tight">
            {total > 0 ? `${total} scenes` : "Scenes"} in {p.categories.length} {p.categories.length === 1 ? "category" : "categories"}
          </h2>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button data-active={cat === null} onClick={() => setCat(null)} className="pill px-4 py-2 text-[13px]">
          All <span className="text-ink-3">{total}</span>
        </button>
        {p.categories.map((c) => (
          <button
            key={c.name}
            data-active={cat === c.name}
            onClick={() => setCat(cat === c.name ? null : c.name)}
            className="pill px-4 py-2 text-[13px]"
          >
            {c.name} <span className="text-ink-3">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((r, i) => (
          <Row key={`${cat}-${i}`} scenes={r} />
        ))}
        {rows.every((r) => !r.length) && <p className="text-[13px] text-ink-2">Previews for this category are coming soon.</p>}
      </div>
    </section>
  );
}
