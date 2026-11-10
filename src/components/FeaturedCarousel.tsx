"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { money, startingPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { AppBadge, productApps } from "./AppBadge";
import { Stars } from "./Stars";
import { useStore } from "./store";

const INTERVAL = 6000;

export function FeaturedCarousel({ items }: { items: Product[] }) {
  const n = items.length;
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const drag = useRef<{ x: number; moved: boolean; width: number } | null>(null);
  const router = useRouter();
  const { muted, setMuted } = useStore();

  const go = useCallback((d: number) => setIndex((i) => (i + d + n) % n), [n]);

  useEffect(() => {
    if (paused || dragging || n < 2) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, dragging, go, n]);

  if (!n) return null;

  const offsetOf = (i: number) => {
    let o = (i - index + n) % n;
    if (o > n / 2) o -= n;
    return o;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, moved: false, width: (e.currentTarget as HTMLElement).clientWidth };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 6 && !drag.current.moved) {
      drag.current.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (drag.current.moved) setDragX(dx);
  };
  const endDrag = () => {
    const d = drag.current;
    if (!d) return;
    const threshold = Math.min(120, d.width * 0.12);
    if (d.moved && dragX < -threshold) go(1);
    else if (d.moved && dragX > threshold) go(-1);
    setDragX(0);
    setDragging(false);
    setTimeout(() => (drag.current = null), 0);
  };

  const active = items[index];

  return (
    <div
      className="relative h-full min-h-[340px] select-none overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured projects"
    >
      <div
        className={`absolute inset-0 touch-pan-y ${dragging && drag.current?.moved ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {items.map((p, i) => {
          const o = offsetOf(i);
          const abs = Math.abs(o);
          const isActive = o === 0;
          return (
            <div
              key={p.id}
              className="absolute inset-y-[4%] left-[12%] w-[76%]"
              style={{
                transform: `translateX(calc(${o * 96}% + ${dragX}px)) scale(${isActive ? 1 : 0.86})`,
                filter: isActive ? "none" : "blur(5px) brightness(0.55) saturate(0.8)",
                opacity: abs > 1 ? 0 : 1,
                zIndex: 10 - abs,
                transition: dragging ? "none" : "transform 700ms cubic-bezier(.2,.8,.2,1), filter 700ms, opacity 500ms",
              }}
              aria-hidden={!isActive}
              onClick={(e) => {
                if (drag.current?.moved) return e.preventDefault();
                if (isActive) router.push(`/p/${p.slug}`);
                else go(o);
              }}
            >
              <Slide product={p} active={isActive} muted={muted} />
            </div>
          );
        })}
      </div>

      {/* Info for the active slide */}
      <div className="pointer-events-none absolute inset-x-[12%] bottom-[4%] z-20 p-5 md:p-7">
        <div key={active.id} className="animate-fade-up pointer-events-auto flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="label !text-white/70">
              Featured · {String(index + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}
            </p>
            <h2 className="mt-2 text-3xl leading-[1.02] tracking-tight md:text-5xl">{active.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-white/75">
              {productApps(active).map((a) => (
                <AppBadge key={a} app={a} size="md" />
              ))}
              {active.reviewCount > 0 && (
                <span className="ml-1 flex items-center gap-1.5">
                  <Stars value={active.rating} size={12} /> {active.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <Link href={`/p/${active.slug}`} className="btn-primary h-11 px-5 text-[14px]">
            View · from {money(startingPrice(active).final)} <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      <div className="absolute right-[12%] top-[4%] z-20 flex gap-2 p-4">
        <button className="pill h-9 w-9 justify-center !gap-0" onClick={() => setMuted(!muted)} aria-label={muted ? "Sound on" : "Sound off"}>
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button className="pill h-9 w-9 justify-center !gap-0" onClick={() => go(-1)} aria-label="Previous">
          <ArrowLeft size={15} />
        </button>
        <button className="pill h-9 w-9 justify-center !gap-0" onClick={() => go(1)} aria-label="Next">
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 pb-1">
        {items.map((p, i) => (
          <button key={p.id} onClick={() => setIndex(i)} className="h-1 w-8 overflow-hidden rounded-full bg-white/20" aria-label={`Show ${p.title}`}>
            {i === index && (
              <span
                key={`${index}-${paused}`}
                className="block h-full bg-white"
                style={{ animation: paused ? "none" : `fs-progress ${INTERVAL}ms linear forwards`, width: paused ? "100%" : undefined }}
              />
            )}
          </button>
        ))}
      </div>
      <style>{`@keyframes fs-progress{from{width:0}to{width:100%}}`}</style>
    </div>
  );
}

function Slide({ product: p, active, muted }: { product: Product; active: boolean; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.muted = muted;
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
    } else {
      v.pause();
    }
  }, [active, muted]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-black/40 shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] ring-1 ring-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.previewImage} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      {p.previewVideo && (
        <video
          ref={ref}
          src={p.previewVideo}
          poster={p.previewImage}
          muted
          loop
          playsInline
          preload={active ? "auto" : "none"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
    </div>
  );
}
