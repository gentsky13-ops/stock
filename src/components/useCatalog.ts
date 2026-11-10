"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { SortValue } from "@/lib/config";

export interface CatalogFilters {
  app: "ae" | "pr" | null;
  feature: "motionbro" | "autoresize" | null;
  sale: boolean;
  tag: string | null;
  q: string;
  sort: SortValue;
}

const SORTS: SortValue[] = ["popular", "new", "rating", "price-asc", "price-desc"];

export function useCatalog() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters: CatalogFilters = useMemo(() => {
    const app = sp.get("app");
    const feature = sp.get("feature");
    const sort = sp.get("sort") as SortValue;
    return {
      app: app === "ae" || app === "pr" ? app : null,
      feature: feature === "motionbro" || feature === "autoresize" ? feature : null,
      sale: sp.get("sale") === "1",
      tag: sp.get("tag"),
      q: sp.get("q") ?? "",
      sort: SORTS.includes(sort) ? sort : "popular",
    };
  }, [sp]);

  const setFilters = useCallback(
    (patch: Partial<CatalogFilters>, opts?: { scroll?: boolean }) => {
      const next = { ...filters, ...patch };
      const p = new URLSearchParams();
      if (next.app) p.set("app", next.app);
      if (next.feature) p.set("feature", next.feature);
      if (next.sale) p.set("sale", "1");
      if (next.tag) p.set("tag", next.tag);
      if (next.q) p.set("q", next.q);
      if (next.sort !== "popular") p.set("sort", next.sort);
      const qs = p.toString();
      const url = qs ? `/?${qs}` : "/";
      if (pathname === "/") {
        // Client-side filtering: update the URL without a server round-trip.
        window.history.replaceState(null, "", url);
        if (opts?.scroll) document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push(url + (opts?.scroll ? "#catalog" : ""));
      }
    },
    [filters, pathname, router],
  );

  const active = !!(filters.app || filters.feature || filters.sale || filters.tag || filters.q);
  return { filters, setFilters, active, isHome: pathname === "/" };
}
