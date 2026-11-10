import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl, randomToken, safeNext } from "@/lib/auth";

export async function GET(req: Request) {
  const base = appUrl(req);
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${base}/login?error=google_not_configured&next=${encodeURIComponent(next)}`);
  }
  const state = randomToken(16);
  (await cookies()).set("fs_oauth", JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${base}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
