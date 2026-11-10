import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/orders";
import { getProductBySlug, listProducts, relatedProducts } from "@/lib/products";
import { getUserReview, listReviews, ratingBreakdown } from "@/lib/reviews";
import { IncludedSection } from "@/components/IncludedSection";
import { ProductCard } from "@/components/ProductCard";
import { ProductFeatures } from "@/components/ProductFeatures";
import { ProductVideo } from "@/components/ProductVideo";
import { PurchaseCard } from "@/components/PurchaseCard";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsSection } from "@/components/ReviewsSection";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProductBySlug(slug);
  return p ? { title: p.title, description: p.tagline || p.description.slice(0, 150) } : {};
}

export default async function ProductPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const p = getProductBySlug(slug);
  if (!p) notFound();

  const user = await getCurrentUser();
  const owned = !!user && hasPurchased(user.id, p.id);
  const userReview = owned && user ? getUserReview(p.id, user.id) : null;
  const reviews = listReviews(p.id, 400);
  const related = relatedProducts(p, listProducts(), 4);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
      <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
        <ProductVideo src={p.previewVideo} poster={p.previewImage} title={p.title} />
        <div className="lg:sticky lg:top-20">
          <PurchaseCard product={p} owned={owned} />
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
        <div>
          <p className="label">About this project</p>
          <p className="mt-4 max-w-3xl text-[clamp(1.25rem,2vw,1.6rem)] leading-snug tracking-tight">{p.description}</p>
        </div>
      </section>

      <section className="mt-16">
        <ProductFeatures product={p} />
      </section>

      <div className="mt-20">
        <IncludedSection product={p} />
      </div>

      <div className="mt-20">
        <ReviewsSection rating={p.rating} count={p.reviewCount} breakdown={ratingBreakdown(p.id)} reviews={reviews}>
          {owned && (
            <div className="mb-2">
              <p className="mb-2 text-[13px] text-ink-2">{userReview ? "Thanks for your review!" : "You own this project — how do you like it?"}</p>
              <ReviewForm productId={p.id} initial={userReview && { rating: userReview.rating, body: userReview.body }} />
            </div>
          )}
        </ReviewsSection>
      </div>

      {p.tags.length > 0 && (
        <div className="mt-14 flex flex-wrap items-center gap-1.5">
          <span className="label mr-2 !text-[10px]">Tags</span>
          {p.tags.map((t) => (
            <Link
              key={t}
              href={`/?tag=${encodeURIComponent(t)}#catalog`}
              className="rounded-md border border-white/12 px-2 py-0.5 font-mono text-[11px] text-ink-2 transition hover:border-white/30 hover:text-ink"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <p className="label">You might also like</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
