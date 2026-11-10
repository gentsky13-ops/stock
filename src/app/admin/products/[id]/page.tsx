import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProductInput } from "@/lib/products";
import { adminGuard } from "../../guard";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const denied = await adminGuard(`/admin/products/${id}`);
  if (denied) return denied;
  const product = getProductInput(Number(id));
  if (!product) notFound();
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl">Edit: {product.title}</h1>
      <ProductForm initial={product} />
    </div>
  );
}
