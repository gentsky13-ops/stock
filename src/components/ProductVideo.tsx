"use client";

import { useEffect, useRef } from "react";
import { useStore } from "./store";

export function ProductVideo({ src, poster, title }: { src: string; poster: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { muted } = useStore();
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
    // Only on mount: afterwards the native controls own the mute state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overflow-hidden rounded-[28px] bg-black ring-1 ring-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)]">
      {src ? (
        <video ref={ref} src={src} poster={poster} controls loop playsInline muted className="aspect-video w-full bg-black" aria-label={`${title} preview`} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={title} className="aspect-video w-full object-cover" />
      )}
    </div>
  );
}
