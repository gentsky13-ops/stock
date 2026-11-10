"use client";

import { APP_LABELS, type AppCode } from "@/lib/config";

/** Minimal app mark; hovering expands it into the full name. */
export function AppBadge({ app, size = "sm" }: { app: AppCode; size?: "sm" | "md" }) {
  const { short, long } = APP_LABELS[app];
  const tone =
    app === "ae"
      ? "text-[#c9b8ff] border-[#c9b8ff]/35"
      : app === "pr"
        ? "text-[#b6c7ff] border-[#9fb4ff]/35"
        : "text-[#ffd2b0] border-[#ffc59a]/35";
  return (
    <span
      className={`group/badge inline-flex items-center overflow-hidden rounded-lg border bg-black/35 backdrop-blur-md ${tone} ${
        size === "md" ? "h-8 px-2 text-[13px]" : "h-6 px-1.5 text-[11px]"
      }`}
    >
      <span className="font-semibold tracking-tight">{short}</span>
      <span className="max-w-0 whitespace-nowrap text-ink opacity-0 transition-all duration-300 ease-out group-hover/badge:ml-1.5 group-hover/badge:max-w-[180px] group-hover/badge:opacity-100">
        {long}
      </span>
    </span>
  );
}

export function productApps(p: { hasAe: boolean; hasPr: boolean; motionbro: boolean }): AppCode[] {
  return [p.hasAe && "ae", p.hasPr && "pr", p.motionbro && "mo"].filter(Boolean) as AppCode[];
}
