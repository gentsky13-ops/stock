import ProductForm from "@/components/admin/ProductForm";
import { adminGuard } from "../../guard";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const denied = await adminGuard("/admin/products/new");
  if (denied) return denied;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl">New project</h1>
      <ProductForm />
    </div>
  );
}
