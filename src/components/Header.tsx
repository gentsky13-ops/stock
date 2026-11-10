"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, ShoppingBag, User, X } from "lucide-react";
import { SITE, SORT_OPTIONS } from "@/lib/config";
import type { SessionUser } from "@/lib/types";
import { useStore } from "./store";
import { useCatalog, type CatalogFilters } from "./useCatalog";

const NAV: { label: string; patch: Partial<CatalogFilters>; is: (f: CatalogFilters) => boolean }[] = [
  { label: "All", patch: { app: null, feature: null, sale: false, tag: null }, is: (f) => !f.app && !f.feature && !f.sale && !f.tag },
  { label: "After Effects", patch: { app: "ae" }, is: (f) => f.app === "ae" },
  { label: "Premiere Pro", patch: { app: "pr" }, is: (f) => f.app === "pr" },
  { label: "MotionBro", patch: { feature: "motionbro" }, is: (f) => f.feature === "motionbro" },
  { label: "Auto-resize", patch: { feature: "autoresize" }, is: (f) => f.feature === "autoresize" },
];

export function Header({ user, admin }: { user: SessionUser | null; admin: boolean }) {
  const { cart, ready, setCartOpen } = useStore();
  const { filters, setFilters, isHome } = useCatalog();
  const [q, setQ] = useState(filters.q);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the input in sync when filters change elsewhere
  useEffect(() => setQ(filters.q), [filters.q]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!sortOpen) return;
    const close = (e: MouseEvent) => !sortRef.current?.contains(e.target as Node) && setSortOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sortOpen]);

  const submitSearch = (value: string) => setFilters({ q: value.trim() }, { scroll: true });

  // Live search on the home page (debounced).
  useEffect(() => {
    if (!isHome || q === filters.q) return;
    const t = setTimeout(() => setFilters({ q: q.trim() }), 250);
    return () => clearTimeout(t);
  }, [q, isHome, filters.q, setFilters]);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300 ${
        scrolled ? "border-b border-line bg-[#1c1d20]/70 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => isHome && setFilters({ app: null, feature: null, sale: false, tag: null, q: "" })}>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25 font-mono text-[11px]">{SITE.short}</span>
          <span className="hidden text-[15px] font-medium tracking-tight sm:inline">{SITE.name}</span>
        </Link>

        <nav className="no-scrollbar ml-2 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Categories">
          {NAV.map((n) => {
            const on = isHome && n.is(filters);
            return (
              <button
                key={n.label}
                onClick={() => setFilters({ app: null, feature: null, sale: false, tag: null, ...n.patch }, { scroll: true })}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition ${on ? "bg-white/12 text-ink" : "text-ink-2 hover:text-ink"}`}
              >
                {n.label}
              </button>
            );
          })}
          <button
            onClick={() => setFilters({ app: null, feature: null, tag: null, sale: true }, { scroll: true })}
            className={`ml-1 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition ${
              isHome && filters.sale ? "bg-sale/20 text-sale" : "text-sale/85 hover:text-sale"
            }`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sale" /> On sale
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form
            className="pill hidden h-10 w-56 px-3.5 md:flex xl:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(q);
            }}
            role="search"
          >
            <Search size={15} className="shrink-0 text-ink-2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-3"
              aria-label="Search templates"
            />
            {q && (
              <button type="button" onClick={() => { setQ(""); setFilters({ q: "" }); }} aria-label="Clear search">
                <X size={14} className="text-ink-2" />
              </button>
            )}
          </form>

          {isHome && (
            <div className="relative" ref={sortRef}>
              <button className="pill h-10 px-3.5 text-[13px]" onClick={() => setSortOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={sortOpen}>
                <span className="hidden text-ink-2 sm:inline">Sort</span>
                {SORT_OPTIONS.find((s) => s.value === filters.sort)?.label}
                <ChevronDown size={14} className={`text-ink-2 transition ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="glass animate-fade-up absolute right-0 top-12 w-52 rounded-2xl p-1.5" role="listbox">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      role="option"
                      aria-selected={filters.sort === s.value}
                      onClick={() => {
                        setFilters({ sort: s.value });
                        setSortOpen(false);
                      }}
                      className={`block w-full rounded-xl px-3 py-2 text-left text-[13px] transition hover:bg-white/10 ${
                        filters.sort === s.value ? "text-ink" : "text-ink-2"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="pill relative h-10 px-3.5 text-[13px]" onClick={() => setCartOpen(true)} aria-label="Open cart">
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {ready && cart.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-semibold text-black">
                {cart.length}
              </span>
            )}
          </button>
          {admin && (
            <Link href="/admin" className="pill hidden h-10 px-3.5 text-[13px] md:inline-flex">
              Admin
            </Link>
          )}
          <Link href={user ? "/account" : "/login"} className="pill h-10 px-3.5 text-[13px]" aria-label={user ? "Your account" : "Sign in"}>
            <User size={16} />
            <span className="hidden sm:inline">{user ? "Library" : "Sign in"}</span>
          </Link>
        </div>
      </div>

      {/* Compact category row for small screens */}
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden" aria-label="Categories">
        {NAV.map((n) => (
          <button
            key={n.label}
            onClick={() => setFilters({ app: null, feature: null, sale: false, tag: null, ...n.patch }, { scroll: true })}
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${isHome && n.is(filters) ? "bg-white/12" : "text-ink-2"}`}
          >
            {n.label}
          </button>
        ))}
        <button
          onClick={() => setFilters({ app: null, feature: null, tag: null, sale: true }, { scroll: true })}
          className="shrink-0 rounded-full px-3 py-1 text-[12px] text-sale"
        >
          On sale
        </button>
      </nav>
    </header>
  );
}
