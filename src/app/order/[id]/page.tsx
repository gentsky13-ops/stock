import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, safeEqual } from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
import { getOrder, orderItems } from "@/lib/orders";
import { money } from "@/lib/pricing";
import { getProductById } from "@/lib/products";
import { LibraryList, type LibraryItem } from "@/components/LibraryList";
import { ClearCart } from "@/components/ClearCart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thank you" };

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const key = typeof sp.key === "string" ? sp.key : "";
  const order = getOrder(Number(id));
  const user = await getCurrentUser();
  if (!order || order.status !== "paid") notFound();
  const owner = !!user && user.id === order.user_id;
  if (!owner && !(key && safeEqual(key, order.access_key))) notFound();

  const items: LibraryItem[] = orderItems(order.id).flatMap((r) => {
    const product = getProductById(r.product_id);
    return product
      ? [{ itemId: r.item_id, product, format: r.format, license: r.license, price: r.price, paidAt: r.paid_at }]
      : [];
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8">
      <ClearCart />
      <section className="block-sand grain overflow-hidden rounded-[32px] px-6 py-10 md:px-12 md:py-14">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-black/55">
          <span>Order #{order.id}</span>
          <span>{money(order.total)} paid</span>
        </div>
        <h1 className="mt-8 text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-[-0.035em]">
          Thank you.
          <br />
          <span className="text-black/45">Your files are ready.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-black/70">
          {owner ? (
            <>Everything is also saved in your library.</>
          ) : (
            <>
              We sent a receipt and a sign-in link to <b className="font-medium text-black">{order.email}</b>
              {mailConfigured() ? "" : " (in demo mode the email is printed to the server console)"}. Next time, just sign in
              with this email or Google to find all your projects.
            </>
          )}
        </p>
      </section>

      <div className="mt-8">
        <LibraryList items={items} accessKey={owner ? undefined : key} canReview={owner} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {owner ? (
          <Link href="/account" className="btn-primary h-11 px-5 text-[14px]">
            Open your library
          </Link>
        ) : (
          <Link href={`/login?next=/account`} className="btn-primary h-11 px-5 text-[14px]">
            Sign in to your library
          </Link>
        )}
        <Link href="/" className="pill h-11 px-5 text-[14px]">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
