"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Plus, Volume2, VolumeX } from "lucide-react";
import { defaultFormat, money, nextItemDiscount, startingPrice, unitPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { AppBadge, productApps } from "./AppBadge";
import { Stars } from "./Stars";
import { useStore } from "./store";

export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const { cart, addToCart, muted, setMuted, toast } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | undefined>();
  const [playing, setPlaying] = useState(false);
  const price = startingPrice(p);
  const inCart = cart.some((c) => c.productId === p.id);

  const enter = () => {
    setHover(true);
    if (!p.previewVideo) return;
    if (!videoSrc) setVideoSrc(p.previewVideo);
    const v = videoRef.current;
    if (v) {
      v.muted = muted;
      v.play().catch(() => {
        // Autoplay with sound can be blocked until the user interacts; fall back to muted.
        v.muted = true;
        v.play().catch(() => {});
      });
    }
  };
  const leave = () => {
    setHover(false);
    setPlaying(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    const format = defaultFormat(p);
    const discount = nextItemDiscount(cart.length + 1);
    addToCart({
      productId: p.id,
      format,
      license: "standard",
      slug: p.slug,
      title: p.title,
      image: p.previewImage,
      unit: unitPrice(p, format, "standard"),
    });
    toast(`Added “${p.title}”`, discount ? `· next project ${discount}% off` : undefined);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMuted(!muted);
    if (videoRef.current) videoRef.current.muted = !muted;
  };

  return (
    <Link
      href={`/p/${p.slug}`}
      className="group relative block aspect-video overflow-hidden rounded-[20px] bg-black/30 ring-1 ring-white/10 transition duration-300 hover:ring-white/25"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.previewImage}
        alt={p.title}
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      {videoSrc && (
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el && hover && el.paused) {
              el.muted = muted;
              el.play().catch(() => {
                el.muted = true;
                el.play().catch(() => {});
              });
            }
          }}
          src={videoSrc}
          muted={muted}
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${playing && hover ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* Always-visible app marks */}
      <div className="absolute left-2.5 top-2.5 z-10 flex gap-1">
        {productApps(p).map((a) => (
          <AppBadge key={a} app={a} />
        ))}
      </div>

      <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5">
        {p.previewVideo && (
          <button
            onClick={toggleSound}
            className={`grid h-7 w-7 place-items-center rounded-full bg-black/40 text-ink backdrop-blur-md transition duration-200 hover:bg-black/60 ${
              hover ? "opacity-100" : "opacity-0"
            }`}
            aria-label={muted ? "Turn preview sound on" : "Turn preview sound off"}
            title={muted ? "Sound off — click to turn on for all previews" : "Sound on"}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        )}
        {p.salePercent > 0 && (
          <span className="rounded-full bg-sale px-2 py-0.5 text-[11px] font-semibold text-black">−{p.salePercent}%</span>
        )}
      </div>

      {/* Hover info */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3.5 pb-3 pt-10 transition duration-300 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 ${
          hover ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium tracking-tight">{p.title}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-2">
            <Stars value={p.rating} size={11} />
            <span>{p.reviewCount > 0 ? `(${p.reviewCount})` : "New"}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right leading-tight">
            {price.final !== price.list && <p className="text-[11px] text-ink-3 line-through">{money(price.list)}</p>}
            <p className="text-[14px] font-medium">{money(price.final)}</p>
          </div>
          <button
            onClick={quickAdd}
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              inCart ? "bg-white/20 text-ink" : "bg-white text-black hover:scale-105"
            }`}
            aria-label={inCart ? "In cart" : `Add ${p.title} to cart`}
          >
            {inCart ? <Check size={15} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
