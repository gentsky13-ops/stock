import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  if (await getCurrentUser()) redirect(next);
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-8">
      {/* Photo-5 style panel */}
      <div className="block-sky grain mx-auto max-w-xl overflow-hidden rounded-[32px] text-white">
        <div className="border-b border-white/30 px-8 py-6 text-center">
          <p className="text-xl tracking-tight">Your library</p>
          <p className="text-[14px] text-white/75">Sign in to download your projects</p>
        </div>
        <div className="px-8 pb-10 pt-8">
          <LoginForm next={next} error={error} />
          <p className="mt-8 text-center text-[12px] leading-relaxed text-white/70">
            No password, no subscription. Use the same email you bought with — every purchase is waiting in your library.
          </p>
        </div>
      </div>
    </div>
  );
}
