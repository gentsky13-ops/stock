import "server-only";
import { SITE } from "./config";

export const mailConfigured = () => !!process.env.RESEND_API_KEY;

/** Demo mode: instant checkout without a payment provider and on-screen sign-in links. Always on in development. */
export const demoMode = () => process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "1";

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs to the server console. */
export async function sendMail(to: string, subject: string, text: string) {
  if (!mailConfigured()) {
    console.log(`\n[mail] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || `${SITE.name} <onboarding@resend.dev>`,
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) console.error("[mail] send failed", res.status, await res.text());
}
