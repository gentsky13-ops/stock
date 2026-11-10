import { NextResponse } from "next/server";
import { appUrl, clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSession();
  return NextResponse.redirect(`${appUrl(req)}/`, { status: 303 });
}
