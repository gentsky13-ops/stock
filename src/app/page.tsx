import { Suspense } from "react";
import { featuredProducts, listProducts, popularTags } from "@/lib/products";
import { BUNDLE_DISCOUNTS } from "@/lib/config";
import { Catalog } from "@/components/Catalog";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { HeroPanel } from "@/components/HeroPanel";

export const dynamic = "force-dynamic";

export default function Home() {
  const products = listProducts();
  const featured = featuredProducts(products);
  const tags = popularTags(products, 14);

  return (
    <div className="mx-auto max-w-[1600px] px-4 md:px-8">
      <section className="grid gap-6 pb-14 pt-6 lg:grid-cols-3 lg:gap-4 lg:pt-8">
        <div className="lg:col-span-1 lg:min-h-[calc(100svh-7rem)] lg:pr-6">
          <Suspense>
            <HeroPanel products={products} tags={tags} />
          </Suspense>
        </div>
        <div className="-mx-4 self-center md:mx-0 lg:col-span-2">
          <FeaturedCarousel items={featured} />
        </div>
      </section>

      <Suspense>
        <Catalog products={products} />
      </Suspense>

      {/* Photo-3 style information block */}
      <section className="block-sand grain mt-24 overflow-hidden rounded-[32px] px-6 py-12 md:px-14 md:py-16">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-black/55">How pricing works</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-black/55">No subscription</p>
        </div>
        <h2 className="mt-8 max-w-2xl text-[clamp(2rem,4vw,3.4rem)] leading-[1.04] tracking-[-0.03em]">
          Every template has its own price. Buy once, use forever.
        </h2>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {[
            { k: "Second project", v: `−${BUNDLE_DISCOUNTS.second}%`, t: "Add a second template to your cart — the cheaper one is 15% off." },
            { k: "Third and beyond", v: `−${BUNDLE_DISCOUNTS.thirdPlus}%`, t: "Every following project gets 20% off. Discounts land on the lower-priced items." },
            { k: "License", v: "∞", t: "Lifetime license with free updates. Downloads stay in your library forever." },
          ].map((x) => (
            <div key={x.k}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-black/55">{x.k}</p>
              <p className="mt-2 text-[clamp(3.5rem,7vw,6rem)] leading-none tracking-[-0.05em]">{x.v}</p>
              <p className="mt-3 max-w-xs text-[15px] text-black/70">{x.t}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
