"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CartItem, Format } from "@/lib/types";
import type { LicenseCode } from "@/lib/config";

/** Display snapshot; the server re-prices everything at checkout. */
export interface CartEntry extends CartItem {
  slug: string;
  title: string;
  image: string;
  unit: number;
}

interface Toast {
  id: number;
  text: string;
  sub?: string;
}

/*
 * Cart and sound preference live in localStorage and are read with
 * useSyncExternalStore, so every component (including late-hydrating Suspense
 * boundaries) hydrates against the server snapshot and updates afterwards.
 */
const CART_KEY = "fs_cart_v1";
const SOUND_KEY = "fs_sound_on";
const EMPTY: CartEntry[] = [];
const listeners = new Set<() => void>();
let cartCache: CartEntry[] | null = null;
let mutedCache: boolean | null = null;

const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_KEY) cartCache = null;
    if (e.key === SOUND_KEY) mutedCache = null;
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

function readCart(): CartEntry[] {
  if (cartCache === null) {
    try {
      cartCache = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      cartCache = [];
    }
  }
  return cartCache!;
}

function writeCart(next: CartEntry[]) {
  cartCache = next;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  } catch {}
  emit();
}

function readMuted() {
  if (mutedCache === null) {
    try {
      mutedCache = localStorage.getItem(SOUND_KEY) !== "1";
    } catch {
      mutedCache = true;
    }
  }
  return mutedCache;
}

const actions = {
  addToCart: (e: CartEntry) => writeCart([...readCart().filter((c) => c.productId !== e.productId), e]),
  updateItem: (productId: number, format: Format, license: LicenseCode, unit: number) =>
    writeCart(readCart().map((c) => (c.productId === productId ? { ...c, format, license, unit } : c))),
  removeFromCart: (id: number) => writeCart(readCart().filter((c) => c.productId !== id)),
  clearCart: () => writeCart([]),
  setMuted: (v: boolean) => {
    mutedCache = v;
    try {
      localStorage.setItem(SOUND_KEY, v ? "0" : "1");
    } catch {}
    emit();
  },
};

interface UiValue {
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  toast: (text: string, sub?: string) => void;
}

const Ctx = createContext<UiValue | null>(null);
const noopSubscribe = () => () => {};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((text: string, sub?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => ({ cartOpen, setCartOpen, toast }), [cartOpen, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="pill animate-fade-up px-5 py-3 text-sm" role="status">
            <span>{t.text}</span>
            {t.sub && <span className="text-ink-2">{t.sub}</span>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useStore() {
  const ui = useContext(Ctx);
  if (!ui) throw new Error("useStore must be used inside StoreProvider");
  const cart = useSyncExternalStore(subscribe, readCart, () => EMPTY);
  const muted = useSyncExternalStore(subscribe, readMuted, () => true);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return { ...ui, ...actions, cart, muted, ready };
}
