"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Sparkles, Trash2 } from "lucide-react";
import { LICENSES, SITE, type LicenseCode } from "@/lib/config";
import { FORMAT_LABEL, money, nextItemDiscount } from "@/lib/pricing";
import type { Format, SessionUser } from "@/lib/types";
import { useStore } from "./store";
import { DiscountFootnote } from "./CartDrawer";
import { GoogleButton } from "./GoogleButton";

interface Quote {
  mode: "stripe" | "demo";
  subtotal: number;
  discount: number;
  total: number;
  lines: {
    productId: number;
    slug: string;
    title: string;
    image: string;
    format: Format;
    license: LicenseCode;
    unit: number;
    discountPercent: number;
    total: number;
  }[];
}

export function CheckoutView({ user }: { user: SessionUser | null }) {
  const { cart, ready, removeFromCart, clearCart } = useStore();
  const router = useRouter();
  const sp = useSearchParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(sp.get("error") === "payment" ? "Payment wasn't completed. You can try again." : "");

  const key = JSON.stringify(cart.map((c) => [c.productId, c.format, c.license]));
  useEffect(() => {
    if (!ready) return;
    if (!cart.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the cart empties
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(({ productId, format, license }) => ({ productId, format, license })) }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((q) => (q.lines?.length ? setQuote(q) : setQuote(null)))
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, items: cart.map(({ productId, format, license }) => ({ productId, format, license })) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setBusy(false);
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    if (data.url.startsWith("/")) {
      clearCart();
      router.push(data.url);
    } else {
      // Stripe: the cart is cleared on the confirmation page once payment is verified.
      window.location.href = data.url;
    }
  };

  if (ready && !cart.length) {
    return (
      <div className="glass mx-auto max-w-lg rounded-[28px] px-8 py-16 text-center">
        <p className="text-xl tracking-tight">Your cart is empty</p>
        <p className="mt-2 text-[14px] text-ink-2">Pick a template or two — the second one is 15% off.</p>
        <Link href="/" className="btn-primary mt-6 h-11 px-6 text-[14px]">
          Browse templates
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
      {/* Photo-4 style panel */}
      <section className="block-teal grain overflow-hidden rounded-[32px] p-6 md:p-10">
        <div className="flex items-center justify-between text-white/80">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em]">Checkout</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em]">{SITE.name}</p>
        </div>
        <h1 className="mt-8 text-[clamp(2rem,4vw,3.2rem)] leading-[1.04] tracking-[-0.03em] text-white">
          {cart.length} {cart.length === 1 ? "project" : "projects"},
          <br />
          one simple payment.
        </h1>

        <div className="mt-10 space-y-2.5">
          {(quote?.lines ?? []).map((l) => (
            <div key={l.productId} className="flex items-center gap-3.5 rounded-[22px] border border-white/25 bg-white/10 p-2.5 text-white backdrop-blur-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt="" className="h-16 w-28 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <Link href={`/p/${l.slug}`} className="line-clamp-1 text-[15px] hover:underline">
                  {l.title}
                </Link>
                <p className="text-[12px] text-white/70">
                  {FORMAT_LABEL[l.format]} · {LICENSES[l.license].label} license
                </p>
              </div>
              <div className="text-right">
                <p className="text-[15px]">{money(l.total)}</p>
                {l.discountPercent > 0 && (
                  <p className="text-[11px] text-white/70">
                    <span className="line-through">{money(l.unit)}</span> −{l.discountPercent}%
                  </p>
                )}
              </div>
              <button
                onClick={() => removeFromCart(l.productId)}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/15 hover:text-white"
                aria-label={`Remove ${l.title}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!quote && <div className="h-24 animate-pulse rounded-[22px] bg-white/10" />}
        </div>

        <div className="mt-6 flex items-start gap-2.5 text-[13px] text-white/85">
          <Sparkles size={15} className="mt-0.5 shrink-0" />
          <div>
            <p>
              Add {cart.length === 1 ? "a second" : "another"} project and save {nextItemDiscount(cart.length)}%.{" "}
              <Link href="/" className="underline underline-offset-4">
                Keep browsing
              </Link>
            </p>
            <div className="mt-1 [&_p]:!text-white/60">
              <DiscountFootnote count={cart.length} />
            </div>
          </div>
        </div>
      </section>

      <aside className="glass h-fit rounded-[32px] p-6 md:p-7 lg:sticky lg:top-20">
        <p className="label">Order summary</p>
        <div className="mt-4 space-y-1.5 text-[14px]">
          <div className="flex justify-between text-ink-2">
            <span>Subtotal</span>
            <span>{quote ? money(quote.subtotal) : "—"}</span>
          </div>
          {!!quote?.discount && (
            <div className="flex justify-between text-sale">
              <span>Bundle discount</span>
              <span>−{money(quote.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 text-2xl tracking-tight">
            <span>Total</span>
            <span>{quote ? money(quote.total) : "—"}</span>
          </div>
        </div>

        <form onSubmit={pay} className="mt-6 space-y-3">
          {user ? (
            <div className="rounded-2xl border border-line bg-black/15 px-4 py-3 text-[13px]">
              <p className="text-ink-2">Signed in as</p>
              <p className="mt-0.5 truncate">{user.email}</p>
            </div>
          ) : (
            <>
              <GoogleButton next="/checkout" label="Continue with Google" />
              <div className="flex items-center gap-3 text-[11px] text-ink-3">
                <span className="h-px flex-1 bg-line" /> or just your email <span className="h-px flex-1 bg-line" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
                aria-label="Email"
              />
              <p className="px-1 text-[11px] leading-relaxed text-ink-3">
                We&apos;ll send your receipt and a link to your library here. No password needed.
              </p>
            </>
          )}
          {error && <p className="px-1 text-[13px] text-sale">{error}</p>}
          <button type="submit" disabled={busy || !quote} className="btn-primary h-12 w-full text-[15px]">
            <Lock size={14} /> {busy ? "Processing…" : `Pay ${quote ? money(quote.total) : ""}`} {!busy && <ArrowRight size={15} />}
          </button>
          {quote?.mode === "demo" && (
            <p className="text-center text-[11px] text-ink-3">Demo mode — no payment provider configured, the order completes instantly.</p>
          )}
        </form>
      </aside>
    </div>
  );
}
