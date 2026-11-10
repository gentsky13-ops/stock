"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

interface StoreValue {
  cart: CartEntry[];
  ready: boolean;
  addToCart: (e: CartEntry) => void;
  updateItem: (productId: number, format: Format, license: LicenseCode, unit: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
  toast: (text: string, sub?: string) => void;
}

const Ctx = createContext<StoreValue | null>(null);
const CART_KEY = "fs_cart_v1";
const SOUND_KEY = "fs_sound_on";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [muted, setMutedState] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (raw) setCart(JSON.parse(raw));
      setMutedState(localStorage.getItem(SOUND_KEY) !== "1");
    } catch {}
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(e.newValue ? JSON.parse(e.newValue) : []);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartEntry[]) => {
    setCart(next);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addToCart = useCallback(
    (e: CartEntry) => persist([...cart.filter((c) => c.productId !== e.productId), e]),
    [cart, persist],
  );
  const updateItem = useCallback(
    (productId: number, format: Format, license: LicenseCode, unit: number) =>
      persist(cart.map((c) => (c.productId === productId ? { ...c, format, license, unit } : c))),
    [cart, persist],
  );
  const removeFromCart = useCallback((id: number) => persist(cart.filter((c) => c.productId !== id)), [cart, persist]);
  const clearCart = useCallback(() => persist([]), [persist]);

  const setMuted = useCallback((v: boolean) => {
    setMutedState(v);
    try {
      localStorage.setItem(SOUND_KEY, v ? "0" : "1");
    } catch {}
  }, []);

  const toast = useCallback((text: string, sub?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(
    () => ({ cart, ready, addToCart, updateItem, removeFromCart, clearCart, cartOpen, setCartOpen, muted, setMuted, toast }),
    [cart, ready, addToCart, updateItem, removeFromCart, clearCart, cartOpen, muted, setMuted, toast],
  );

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
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
