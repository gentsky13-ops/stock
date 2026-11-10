import { NextResponse } from "next/server";
import { appUrl, createLoginToken, normalizeEmail, safeNext } from "@/lib/auth";
import { demoMode, mailConfigured, sendMail } from "@/lib/mail";
import { SITE } from "@/lib/config";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  const next = safeNext(body.next);
  const token = createLoginToken(email, next);
  const link = `${appUrl(req)}/api/auth/verify?token=${token}`;
  await sendMail(email, `Sign in to ${SITE.name}`, `Click to sign in (valid for 30 minutes):\n${link}\n\nIf you didn't request this, ignore this email.`);
  // Without a mail provider in development, hand the link back so the flow is testable.
  const devLink = !mailConfigured() && demoMode() ? link : undefined;
  return NextResponse.json({ ok: true, devLink });
}
