import Link from "next/link";
import { listProducts } from "@/lib/products";
import { money } from "@/lib/pricing";
import { adminGuard } from "./guard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const denied = await adminGuard("/admin");
  if (denied) return denied;
  const products = listProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="label">Admin</p>
          <h1 className="text-3xl">Projects ({products.length})</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary h-11 px-5 text-[14px]">New project</Link>
      </div>
      <div className="glass overflow-x-auto rounded-[28px] p-2">
        <table className="w-full text-left text-sm">
          <thead className="label">
            <tr>
              <th className="p-3">Project</th>
              <th className="p-3">Formats</th>
              <th className="p-3">Price</th>
              <th className="p-3">Sale</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Sales</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.previewImage ? <img src={p.previewImage} alt="" className="h-10 w-16 rounded-lg object-cover" /> : <div className="h-10 w-16 rounded-lg bg-white/10" />}
                    <span>{p.title}</span>
                  </div>
                </td>
                <td className="p-3 text-ink-2">{[p.hasAe && "Ae", p.hasPr && "Pr"].filter(Boolean).join(" + ")}</td>
                <td className="p-3 text-ink-2">
                  {[p.hasAe && p.priceAe != null && `Ae ${money(p.priceAe)}`, p.hasPr && p.pricePr != null && `Pr ${money(p.pricePr)}`, p.priceBoth != null && `Both ${money(p.priceBoth)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="p-3">{p.salePercent ? <span className="text-sale">-{p.salePercent}%</span> : <span className="text-ink-3">—</span>}</td>
                <td className="p-3 text-ink-2">{p.featured ? `#${p.featuredOrder}` : "—"}</td>
                <td className="p-3 text-ink-2">{p.reviewCount ? `${p.rating} (${p.reviewCount})` : "—"}</td>
                <td className="p-3 text-ink-2">{p.sales}</td>
                <td className="p-3 text-right"><Link href={`/admin/products/${p.id}`} className="pill h-8 px-3.5 text-[13px]">Edit</Link></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-ink-3">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
