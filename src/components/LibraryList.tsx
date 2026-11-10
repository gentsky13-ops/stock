import Link from "next/link";
import { Download } from "lucide-react";
import { LICENSES, type LicenseCode } from "@/lib/config";
import { FORMAT_LABEL, money } from "@/lib/pricing";
import type { Format, Product } from "@/lib/types";
import { ReviewForm } from "./ReviewForm";

export interface LibraryItem {
  itemId: number;
  product: Product;
  format: Format;
  license: LicenseCode;
  price: number;
  paidAt: string;
  review?: { rating: number; body: string } | null;
}

export function LibraryList({ items, accessKey, canReview }: { items: LibraryItem[]; accessKey?: string; canReview: boolean }) {
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const kinds = it.format === "both" ? (["ae", "pr"] as const) : ([it.format] as const);
        const q = (k: string) => `/api/download/${it.itemId}?kind=${k}${accessKey ? `&key=${accessKey}` : ""}`;
        return (
          <div key={it.itemId} className="glass rounded-[24px] p-3 md:p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <Link href={`/p/${it.product.slug}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.product.previewImage} alt="" className="aspect-video w-full rounded-2xl object-cover md:w-44" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/p/${it.product.slug}`} className="text-[17px] tracking-tight hover:underline">
                  {it.product.title}
                </Link>
                <p className="mt-0.5 text-[12px] text-ink-2">
                  {FORMAT_LABEL[it.format]} · {LICENSES[it.license].label} license · {money(it.price)} ·{" "}
                  {new Date(it.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                {canReview && (
                  <div className="mt-3">
                    <ReviewForm productId={it.product.id} initial={it.review} compact />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {kinds.map((k) => (
                  <a key={k} href={q(k)} className="btn-primary h-10 px-4 text-[13px]">
                    <Download size={14} /> {k === "ae" ? "After Effects" : "Premiere Pro"}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
