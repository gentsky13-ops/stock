import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { CheckoutView } from "@/components/CheckoutView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-8">
      <Suspense>
        <CheckoutView user={user} />
      </Suspense>
    </div>
  );
}
