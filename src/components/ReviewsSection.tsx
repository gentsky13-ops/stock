"use client";

import { BadgeCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Review } from "@/lib/types";
import { Modal } from "./Modal";
import { Stars } from "./Stars";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function ReviewItem({ r }: { r: Review }) {
  return (
    <div className="rounded-[22px] border border-line bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-[#d9a487]/40 to-white/5 text-[12px]">
            {r.authorName.charAt(0)}
          </span>
          <div>
            <p className="flex items-center gap-1 text-[14px] leading-tight">
              {r.authorName}
              {r.verified && <BadgeCheck size={13} className="text-ink-2" aria-label="Verified buyer" />}
            </p>
            <p className="text-[11px] text-ink-3">{fmtDate(r.createdAt)}</p>
          </div>
        </div>
        <Stars value={r.rating} size={12} />
      </div>
      {r.body && <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{r.body}</p>}
    </div>
  );
}

export function ReviewsSection({
  rating,
  count,
  breakdown,
  reviews,
  children,
}: {
  rating: number;
  count: number;
  breakdown: Record<number, number>;
  reviews: Review[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<"new" | "high" | "low">("new");
  const sorted = useMemo(() => {
    const r = [...reviews];
    if (sort === "high") r.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    if (sort === "low") r.sort((a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt));
    return r;
  }, [reviews, sort]);

  return (
    <section id="reviews" className="scroll-mt-24">
      <p className="label">Ratings & reviews</p>
      <div className="mt-5 grid gap-8 lg:grid-cols-[320px_1fr]">
        <div>
          <p className="text-[72px] leading-none tracking-[-0.05em]">{count ? rating.toFixed(1) : "—"}</p>
          <Stars value={rating} size={20} className="mt-3" />
          <p className="mt-2 text-[13px] text-ink-2">
            {count ? `Based on ${count} ${count === 1 ? "review" : "reviews"}` : "No reviews yet"}
          </p>
          {count > 0 && (
            <div className="mt-5 space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="flex items-center gap-2.5 text-[12px] text-ink-2">
                  <span className="w-3">{s}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-star/80" style={{ width: `${(breakdown[s] / count) * 100}%` }} />
                  </span>
                  <span className="w-8 text-right text-ink-3">{breakdown[s]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {children}
          {reviews.slice(0, 3).map((r) => (
            <ReviewItem key={r.id} r={r} />
          ))}
          {reviews.length > 3 && (
            <button onClick={() => setOpen(true)} className="pill h-11 px-5 text-[14px]">
              Read all {count} reviews
            </button>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} label="All reviews" className="glass max-w-2xl bg-[#26272a]/90">
        <div className="flex max-h-[85vh] flex-col">
          <div className="border-b border-line px-6 pb-4 pt-6 pr-16">
            <div className="flex items-center gap-3">
              <span className="text-3xl tracking-tight">{rating.toFixed(1)}</span>
              <div>
                <Stars value={rating} size={14} />
                <p className="text-[12px] text-ink-2">{count} reviews</p>
              </div>
            </div>
            <div className="segmented mt-4 max-w-xs">
              {(
                [
                  ["new", "Newest"],
                  ["high", "Highest"],
                  ["low", "Lowest"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} data-active={sort === k} onClick={() => setSort(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto p-6">
            {sorted.map((r) => (
              <ReviewItem key={r.id} r={r} />
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
