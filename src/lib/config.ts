// Client-safe site configuration.

export const SITE = {
  name: "Frame Supply",
  short: "FS",
  tagline: "Templates for After Effects & Premiere Pro",
  intro:
    "Hand-crafted After Effects and Premiere Pro templates. Pay once per project, keep it forever. No subscriptions.",
  supportEmail: "support@framesupply.io",
};

export type AppCode = "ae" | "pr" | "mo";

export const APP_LABELS: Record<AppCode, { short: string; long: string }> = {
  ae: { short: "Ae", long: "After Effects Project" },
  pr: { short: "Pr", long: "Premiere Pro Project" },
  mo: { short: "Mo", long: "Works with MotionBro" },
};

export const LICENSES = {
  standard: {
    label: "Standard",
    multiplier: 1,
    hint: "Use in one end product — for yourself or a single client. Personal and commercial use allowed.",
  },
  multi: {
    label: "Multi-use",
    multiplier: 2,
    hint: "Use in unlimited end products and client projects, including paid ads and broadcast.",
  },
} as const;

export type LicenseCode = keyof typeof LICENSES;

/** Bundle discounts by position after sorting cart items by price (desc). */
export const BUNDLE_DISCOUNTS = { second: 15, thirdPlus: 20 } as const;

export const SORT_OPTIONS = [
  { value: "popular", label: "Popular" },
  { value: "new", label: "Newest" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
