import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { db, nowIso, STORAGE_DIR } from "./db";
import type { SessionUser } from "./types";

const COOKIE = "fs_session";
const MAX_AGE = 60 * 60 * 24 * 90;

let secretCache: string | null = null;
function secret() {
  if (secretCache) return secretCache;
  if (process.env.SESSION_SECRET) return (secretCache = process.env.SESSION_SECRET);
  // Local fallback so the app works without configuration; set SESSION_SECRET in production.
  const file = path.join(STORAGE_DIR, ".session-secret");
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
  return (secretCache = fs.readFileSync(file, "utf8").trim());
}

const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function setSession(userId: number) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof uid !== "number" || exp < Date.now()) return null;
    const u = db().prepare("SELECT id, email, name FROM users WHERE id = ?").get(uid) as SessionUser | undefined;
    return u ?? null;
  } catch {
    return null;
  }
}

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

/** Returns the user and whether it was just created. */
export function findOrCreateUser(email: string, name?: string | null, googleSub?: string | null) {
  const d = db();
  let user = d.prepare("SELECT id, email, name FROM users WHERE email = ?").get(email) as SessionUser | undefined;
  if (user) {
    if (googleSub) d.prepare("UPDATE users SET google_sub = COALESCE(google_sub, ?), name = COALESCE(name, ?) WHERE id = ?").run(googleSub, name ?? null, user.id);
    return { user, created: false };
  }
  const res = d
    .prepare("INSERT INTO users (email, name, google_sub, created_at) VALUES (?, ?, ?, ?)")
    .run(email, name ?? null, googleSub ?? null, nowIso());
  user = { id: Number(res.lastInsertRowid), email, name: name ?? null };
  return { user, created: true };
}

export function isAdmin(user: SessionUser | null) {
  if (!user) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  // Without ADMIN_EMAILS, any signed-in user is admin in development only.
  if (!list.length) return process.env.NODE_ENV !== "production";
  return list.includes(user.email.toLowerCase());
}

export function safeNext(next: unknown, fallback = "/account") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function createLoginToken(email: string, next: string) {
  const token = randomToken();
  db()
    .prepare("INSERT INTO login_tokens (token_hash, email, next_url, expires_at) VALUES (?, ?, ?, ?)")
    .run(sha256(token), email, next, Date.now() + 30 * 60 * 1000);
  return token;
}

export function consumeLoginToken(token: string) {
  const d = db();
  d.prepare("DELETE FROM login_tokens WHERE expires_at < ?").run(Date.now());
  const row = d.prepare("SELECT email, next_url FROM login_tokens WHERE token_hash = ?").get(sha256(token)) as
    | { email: string; next_url: string }
    | undefined;
  if (!row) return null;
  d.prepare("DELETE FROM login_tokens WHERE token_hash = ?").run(sha256(token));
  return row;
}

export function appUrl(req?: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (req) {
    const h = req.headers;
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
    return new URL(req.url).origin;
  }
  return "http://localhost:3000";
}
