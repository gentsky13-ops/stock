"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { GoogleButton } from "./GoogleButton";

const ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or was already used. Request a new one.",
  google_failed: "Google sign-in didn't complete. Please try again.",
  google_not_configured: "Google sign-in isn't configured on this server yet — use your email instead.",
};

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [msg, setMsg] = useState(error ? ERRORS[error] ?? "" : "");
  const [devLink, setDevLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setMsg("");
    const res = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("idle");
      setMsg(data.error ?? "Something went wrong.");
      return;
    }
    setDevLink(data.devLink ?? null);
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/50 bg-white/15">
          <Mail size={20} />
        </span>
        <p className="mt-5 text-2xl tracking-tight">Check your inbox</p>
        <p className="mt-2 text-[14px] text-white/80">
          We sent a sign-in link to <b className="font-medium">{email}</b>. It&apos;s valid for 30 minutes.
        </p>
        {devLink && (
          <a href={devLink} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/45 bg-white/20 px-5 text-[14px] hover:bg-white/30">
            Dev mode: open sign-in link <ArrowRight size={14} />
          </a>
        )}
        <button onClick={() => setState("idle")} className="mt-5 block w-full text-[13px] text-white/70 underline underline-offset-4">
          Use another email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GoogleButton next={next} />
      <div className="flex items-center gap-3 py-1 text-[11px] text-white/60">
        <span className="h-px flex-1 bg-white/25" /> or <span className="h-px flex-1 bg-white/25" />
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input !border-white/35 !bg-white/15 !text-white placeholder:!text-white/60"
          autoComplete="email"
          aria-label="Email"
        />
        <button type="submit" disabled={state === "sending"} className="btn-primary h-12 w-full text-[15px]">
          {state === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {msg && <p className="text-center text-[13px] text-white">{msg}</p>}
    </div>
  );
}
