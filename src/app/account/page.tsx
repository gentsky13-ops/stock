import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { userPurchases } from "@/lib/orders";
import { getProductById } from "@/lib/products";
import { getUserReview } from "@/lib/reviews";
import { LibraryList, type LibraryItem } from "@/components/LibraryList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your library" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const items: LibraryItem[] = userPurchases(user.id).flatMap((r) => {
    const product = getProductById(r.product_id);
    if (!product) return [];
    const review = getUserReview(product.id, user.id);
    return [
      {
        itemId: r.item_id,
        product,
        format: r.format,
        license: r.license,
        price: r.price,
        paidAt: r.paid_at,
        review: review && { rating: review.rating, body: review.body },
      },
    ];
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Your library</p>
          <h1 className="mt-2 text-4xl tracking-tight">{user.name ?? user.email}</h1>
          {user.name && <p className="mt-1 text-[14px] text-ink-2">{user.email}</p>}
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="pill h-10 px-4 text-[13px]">
            <LogOut size={14} /> Sign out
          </button>
        </form>
      </div>

      <div className="mt-10">
        {items.length ? (
          <>
            <p className="label mb-4">
              {items.length} {items.length === 1 ? "project" : "projects"}
            </p>
            <LibraryList items={items} canReview />
          </>
        ) : (
          <div className="glass rounded-[28px] px-6 py-16 text-center">
            <p className="text-xl tracking-tight">No projects yet</p>
            <p className="mt-2 text-[14px] text-ink-2">Everything you buy with {user.email} shows up here.</p>
            <Link href="/" className="btn-primary mt-6 h-11 px-6 text-[14px]">
              Browse templates
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
