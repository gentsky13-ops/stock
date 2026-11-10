import { NextResponse } from "next/server";
import { appUrl, consumeLoginToken, findOrCreateUser, safeNext, setSession } from "@/lib/auth";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const row = token ? consumeLoginToken(token) : null;
  if (!row) return NextResponse.redirect(`${appUrl(req)}/login?error=expired`);
  const { user } = findOrCreateUser(row.email);
  await setSession(user.id);
  return NextResponse.redirect(`${appUrl(req)}${safeNext(row.next_url)}`);
}
