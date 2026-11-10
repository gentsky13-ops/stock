"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LICENSES } from "@/lib/config";
import { applyBundleDiscounts, FORMAT_LABEL, money, nextItemDiscount } from "@/lib/pricing";
import { useStore } from "./store";

const noop = () => () => {};

export function DiscountFootnote({ count }: { count: number }) {
  return (
    <p className="text-[11px] leading-relaxed text-ink-3">
      {count <= 1
        ? "* The 15% discount applies to the lower-priced item."
        : "* 20% applies to the 3rd and every following project — always to the lowest-priced items in your cart."}
    </p>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart } = useStore();
  const router = useRouter();
  const priced = applyBundleDiscounts(cart.map((c) => ({ item: c, unit: c.unit })));
  const next = nextItemDiscount(cart.length);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[60] ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <button
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`}
        onClick={() => setCartOpen(false)}
        aria-label="Close cart"
        tabIndex={cartOpen ? 0 : -1}
      />
      <aside
        className={`glass absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col rounded-l-[28px] bg-[#232427]/80 transition-transform duration-300 ease-out ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Cart"
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <div>
            <p className="label">Your cart</p>
            <p className="mt-1 text-xl tracking-tight">
              {cart.length} {cart.length === 1 ? "project" : "projects"}
            </p>
          </div>
          <button className="pill h-9 w-9 justify-center !gap-0" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4">
          {cart.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-ink-2">
              <ShoppingBag size={28} className="text-ink-3" />
              <p>Your cart is empty.</p>
            </div>
          )}
          {priced.lines.map(({ item, unit, discountPercent, total }) => (
            <div key={item.productId} className="flex gap-3 rounded-2xl border border-line bg-black/15 p-2.5">
              <Link href={`/p/${item.slug}`} onClick={() => setCartOpen(false)} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-16 w-28 rounded-xl object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/p/${item.slug}`} onClick={() => setCartOpen(false)} className="line-clamp-1 text-[14px] hover:underline">
                  {item.title}
                </Link>
                <p className="mt-0.5 text-[12px] text-ink-2">
                  {FORMAT_LABEL[item.format]} · {LICENSES[item.license].label}
                </p>
                <div className="mt-1 flex items-baseline gap-2 text-[13px]">
                  <span>{money(total)}</span>
                  {discountPercent > 0 && (
                    <>
                      <span className="text-ink-3 line-through">{money(unit)}</span>
                      <span className="text-sale">−{discountPercent}%</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="self-start rounded-full p-1.5 text-ink-3 transition hover:bg-white/10 hover:text-ink"
                aria-label={`Remove ${item.title}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="space-y-3 border-t border-line px-6 pb-6 pt-4">
            <div className="flex items-start gap-2.5 rounded-2xl bg-white/[0.06] px-3.5 py-3 text-[13px]">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-peach" />
              <div className="space-y-1">
                <p>
                  Add {cart.length === 1 ? "a second" : "another"} project and get <b>{next}% off*</b>
                </p>
                <DiscountFootnote count={cart.length} />
              </div>
            </div>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between text-ink-2">
                <span>Subtotal</span>
                <span>{money(priced.subtotal)}</span>
              </div>
              {priced.discount > 0 && (
                <div className="flex justify-between text-sale">
                  <span>Bundle discount</span>
                  <span>−{money(priced.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-lg tracking-tight">
                <span>Total</span>
                <span>{money(priced.total)}</span>
              </div>
            </div>
            <button
              className="btn-primary h-12 w-full"
              onClick={() => {
                setCartOpen(false);
                router.push("/checkout");
              }}
            >
              Checkout
            </button>
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}
