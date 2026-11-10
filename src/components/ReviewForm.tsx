"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";

export function StarInput({ value, onChange, size = 18 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star size={size} strokeWidth={0} fill="currentColor" className={(hover || value) >= n ? "text-star" : "text-white/20"} />
        </button>
      ))}
    </span>
  );
}

/** One-line rating + review form for buyers. */
export function ReviewForm({
  productId,
  initial,
  compact = false,
}: {
  productId: number;
  initial?: { rating: number; body: string } | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [body, setBody] = useState(initial?.body ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(initial ? "saved" : "idle");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!initial);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Pick a star rating.");
    setState("saving");
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, body }),
    });
    if (!res.ok) {
      setState("error");
      setError((await res.json().catch(() => null))?.error ?? "Couldn't save your review.");
      return;
    }
    setState("saved");
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
        <span>Your review:</span>
        <StarInput value={rating} onChange={() => {}} size={14} />
        {body && <span className="line-clamp-1 max-w-md text-ink">“{body}”</span>}
        <button onClick={() => setEditing(true)} className="underline underline-offset-4 hover:text-ink">
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`flex flex-wrap items-center gap-2 ${compact ? "" : "rounded-full border border-white/12 bg-black/15 p-1.5 pl-4"}`}>
      <StarInput value={rating} onChange={setRating} size={compact ? 15 : 18} />
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        placeholder="Share a few words about this template (optional)"
        className={`min-w-[180px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-3 ${compact ? "input !py-2" : "px-2"}`}
        aria-label="Review text"
      />
      <button type="submit" disabled={state === "saving"} className="btn-primary h-9 px-4 text-[13px]">
        {state === "saving" ? "Saving…" : initial ? "Update" : "Post review"}
      </button>
      {error && <p className="w-full pl-1 text-[12px] text-sale">{error}</p>}
    </form>
  );
}
