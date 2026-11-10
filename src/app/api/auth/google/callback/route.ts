import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl, findOrCreateUser, normalizeEmail, safeEqual, safeNext, setSession } from "@/lib/auth";

export async function GET(req: Request) {
  const base = appUrl(req);
  const url = new URL(req.url);
  const jar = await cookies();
  const saved = jar.get("fs_oauth")?.value;
  jar.delete("fs_oauth");
  let stored: { state?: string; next?: string } = {};
  try {
    stored = saved ? JSON.parse(saved) : {};
  } catch {}
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code");
  if (!code || !stored.state || !safeEqual(state, stored.state)) {
    return NextResponse.redirect(`${base}/login?error=google_failed`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${base}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(`${base}/login?error=google_failed`);
  const { access_token } = await tokenRes.json();

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) return NextResponse.redirect(`${base}/login?error=google_failed`);
  const info = await infoRes.json();
  const email = normalizeEmail(info.email);
  if (!email || info.email_verified !== true) return NextResponse.redirect(`${base}/login?error=google_failed`);

  const { user } = findOrCreateUser(email, info.name ?? null, String(info.sub));
  await setSession(user.id);
  return NextResponse.redirect(`${base}${safeNext(stored.next)}`);
}
