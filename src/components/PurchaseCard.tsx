"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, HardDrive, Info, Monitor, ShoppingBag, Sparkles } from "lucide-react";
import { LICENSES, type LicenseCode } from "@/lib/config";
import { defaultFormat, listPrice, money, nextItemDiscount, unitPrice } from "@/lib/pricing";
import type { Format, Product } from "@/lib/types";
import { Modal } from "./Modal";
import { Stars } from "./Stars";
import { useStore } from "./store";
import { DiscountFootnote } from "./CartDrawer";

export function PurchaseCard({ product: p, owned }: { product: Product; owned: boolean }) {
  const { cart, addToCart } = useStore();
  const router = useRouter();
  const both = p.hasAe && p.hasPr;
  const [ae, setAe] = useState(p.hasAe);
  const [pr, setPr] = useState(!p.hasAe && p.hasPr);
  const [license, setLicense] = useState<LicenseCode>("standard");
  const [infoOpen, setInfoOpen] = useState(false);
  const [added, setAdded] = useState<null | number>(null);

  const format: Format = ae && pr ? "both" : ae ? "ae" : pr ? "pr" : defaultFormat(p);
  const price = unitPrice(p, format, license);
  const list = listPrice(p, format, license);
  const inCart = cart.find((c) => c.productId === p.id);

  const toggle = (which: "ae" | "pr") => {
    // At least one format must stay selected.
    if (which === "ae") {
      if (ae && !pr) return;
      setAe(!ae);
    } else {
      if (pr && !ae) return;
      setPr(!pr);
    }
  };

  const add = () => {
    const countBefore = cart.filter((c) => c.productId !== p.id).length;
    addToCart({ productId: p.id, format, license, slug: p.slug, title: p.title, image: p.previewImage, unit: price });
    setAdded(countBefore + 1);
  };

  const fmtOption = (f: "ae" | "pr", label: string, checked: boolean) => (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => toggle(f)}
      className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition ${
        checked ? "border-white/45 bg-white/12" : "border-white/12 bg-black/15 hover:border-white/25"
      }`}
    >
      <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border ${checked ? "border-white bg-white text-black" : "border-white/35"}`}>
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] leading-tight">{label}</span>
        <span className="block text-[11px] text-ink-2">{money(unitPrice(p, f, license))}</span>
      </span>
    </button>
  );

  return (
    <div className="glass relative rounded-[28px] p-5 md:p-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="pill h-9 w-9 justify-center !gap-0" aria-label="Back to all projects">
          <ArrowLeft size={15} />
        </Link>
        {p.reviewCount > 0 ? (
          <a href="#reviews" className="flex items-center gap-1.5 text-[12px] text-ink-2 hover:text-ink">
            <Stars value={p.rating} size={12} /> {p.rating.toFixed(1)} · {p.reviewCount} reviews
          </a>
        ) : (
          <span className="label">New release</span>
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight tracking-tight">{p.title}</h1>
          <p className="mt-1 text-[13px] text-ink-2">{p.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[30px] leading-none tracking-tight">{money(price)}</p>
          {list !== price && (
            <p className="mt-1 text-[12px]">
              <span className="text-ink-3 line-through">{money(list)}</span> <span className="text-sale">−{p.salePercent}%</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] font-medium">
        {p.resolution && (
          <span className="flex items-center gap-1.5">
            <Monitor size={13} /> {p.resolution}
          </span>
        )}
        {p.sizeLabel && (
          <span className="flex items-center gap-1.5">
            <HardDrive size={13} /> {p.sizeLabel}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="label mb-2">{both ? "Choose version" : "Version"}</p>
        {both ? (
          <>
            <div className="flex gap-2">
              {fmtOption("ae", "After Effects", ae)}
              {fmtOption("pr", "Premiere Pro", pr)}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-3">
              {format === "both" ? "Both versions selected — bundle price applied." : "Select both to get the bundle price."}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/12 bg-black/15 px-3 py-2.5 text-[13px]">
            <Check size={14} /> {p.hasAe ? "After Effects project" : "Premiere Pro project"}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5">
          <p className="label">License</p>
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            onMouseEnter={() => setInfoOpen(true)}
            onMouseLeave={() => setInfoOpen(false)}
            className="grid h-4 w-4 place-items-center rounded-full border border-white/30 text-ink-2 hover:text-ink"
            aria-label="What's the difference between licenses?"
            aria-expanded={infoOpen}
          >
            <Info size={10} />
          </button>
        </div>
        {infoOpen && (
          <div className="animate-fade-up absolute inset-x-5 z-20 mt-[-4px] rounded-2xl border border-white/15 bg-[#2a2b2f]/95 p-3.5 text-[12px] leading-relaxed shadow-2xl backdrop-blur-xl">
            {(Object.keys(LICENSES) as LicenseCode[]).map((k) => (
              <p key={k} className="[&+p]:mt-2">
                <b className="font-medium">{LICENSES[k].label}</b> <span className="text-ink-2">— {LICENSES[k].hint}</span>
              </p>
            ))}
            <Link href="/licenses" className="mt-2 inline-block text-ink-2 underline underline-offset-4 hover:text-ink">
              Full license terms
            </Link>
          </div>
        )}
        <div className="segmented">
          {(Object.keys(LICENSES) as LicenseCode[]).map((k) => (
            <button key={k} type="button" data-active={license === k} onClick={() => setLicense(k)}>
              {LICENSES[k].label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-3">{LICENSES[license].hint}</p>
      </div>

      {p.filesIncluded.length > 0 && (
        <div className="mt-5">
          <p className="label mb-2">Files included</p>
          <ul className="space-y-1.5 text-[13px]">
            {p.filesIncluded.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check size={13} className="text-ink-2" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button className="btn-primary h-12 flex-1 text-[15px]" onClick={add}>
          {inCart ? "Update cart" : "Buy now"} <ArrowRight size={16} />
        </button>
        {inCart && (
          <button className="pill h-12 w-12 justify-center !gap-0" onClick={() => router.push("/checkout")} aria-label="Go to checkout">
            <ShoppingBag size={16} />
          </button>
        )}
      </div>
      {owned && <p className="mt-2 text-center text-[12px] text-ink-2">You own this project — find it in your <Link href="/account" className="underline underline-offset-4">library</Link>.</p>}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-2">
        <Sparkles size={12} className="text-peach" /> {nextItemDiscount(1)}% off your second project · lifetime license
      </p>

      <AddedModal count={added} product={p} onClose={() => setAdded(null)} />
    </div>
  );
}

function AddedModal({ count, product, onClose }: { count: number | null; product: Product; onClose: () => void }) {
  const router = useRouter();
  const pct = nextItemDiscount(count ?? 0);
  return (
    <Modal open={count !== null} onClose={onClose} label="Added to cart" className="block-sky grain max-w-md text-white">
      <div className="px-7 pb-7 pt-9 text-center">
        <p className="text-[13px] text-white/75">Added to your cart</p>
        <p className="mt-1 text-xl tracking-tight">{product.title}</p>
        <div className="mx-auto mt-6 grid h-20 w-20 place-items-center rounded-full border border-white/50 bg-white/15 text-2xl tracking-tight backdrop-blur-md">
          −{pct}%
        </div>
        <p className="mt-5 text-[22px] leading-snug tracking-tight">
          {count === 1 ? "Add a second project" : "Add one more project"}
          <br />
          and get {pct}% off<sup>*</sup>
        </p>
        <div className="mt-7 flex justify-center gap-2.5">
          <button
            onClick={() => {
              onClose();
              router.push("/checkout");
            }}
            className="h-12 rounded-full border border-white/45 bg-white/20 px-6 text-[15px] backdrop-blur-md transition hover:bg-white/30"
          >
            Checkout now
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/#catalog");
            }}
            className="btn-primary h-12 px-6 text-[15px]"
          >
            Browse projects
          </button>
        </div>
        <div className="mt-6 [&_p]:!text-white/70">
          <DiscountFootnote count={count ?? 1} />
        </div>
      </div>
    </Modal>
  );
}
