import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";

/** Returns null when the visitor may use the admin; otherwise a "No access" view (or redirects to login). */
export async function adminGuard(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (isAdmin(user)) return null;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="glass rounded-[28px] p-8">
        <h1 className="text-2xl">No access</h1>
        <p className="mt-2 text-ink-2">
          {user.email} is not an admin. Admin emails are configured via the ADMIN_EMAILS env var.
        </p>
      </div>
    </div>
  );
}
