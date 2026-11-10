import "server-only";
import { db, tx } from "./db";
import type { Review } from "./types";

/*
 * Daily review accrual: a project starts with 0 reviews. For every calendar day
 * (UTC) after its creation date, 1–10 reviews are added. The generator is
 * seeded by (product id, date), so catching up after downtime yields the same
 * result as running daily, and reviews are dated within the day they belong to.
 */

const MAX_CATCHUP_DAYS = 400;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Alex", "Maria", "Daniel", "Sofia", "Lucas", "Emma", "Noah", "Olivia", "Liam", "Mia", "Ethan", "Ava", "Leo", "Chloe",
  "Mateo", "Hannah", "Jonas", "Elena", "Kenji", "Aisha", "Marco", "Nina", "Tom", "Sara", "Ivan", "Julia", "Pablo",
  "Zoe", "Omar", "Lena", "Ryan", "Isabel", "Felix", "Anna", "Diego", "Clara", "Max", "Yuki", "Ben", "Laura",
];
const LAST = "ABCDEFGHJKLMNOPRSTVWZ";

const OPENERS = [
  "Super clean template.",
  "Exactly what I needed for a client job.",
  "Really well organized project.",
  "Great value for the price.",
  "Saved me hours of work.",
  "Beautiful animations out of the box.",
  "Bought it for a YouTube channel rebrand.",
  "Second purchase from this shop.",
  "Very smooth motion and nice typography.",
  "Used it for an event promo.",
];
const MIDDLES = [
  "The controls panel makes changing colors and fonts really fast.",
  "Text boxes resize automatically, which is a huge time saver.",
  "Render times are fast, nothing heavy in the project.",
  "Opened without any expression errors in my non-English version.",
  "The video tutorial covers everything you need.",
  "Duration control works great — just drag the comp and it adapts.",
  "Everything is labeled and easy to find.",
  "Lots of variations, I keep finding new scenes to use.",
  "Swapping media is quick and simple.",
  "Works perfectly in the latest version.",
];
const CLOSERS = [
  "Highly recommend.",
  "Will buy again.",
  "Five stars from me.",
  "Client was happy.",
  "Worth every cent.",
  "",
  "",
  "Would love even more scenes in a future update.",
  "Took a bit to learn, but solid.",
];

function makeReview(r: () => number) {
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const roll = r();
  const rating = roll < 0.68 ? 5 : roll < 0.94 ? 4 : 3;
  const parts = [pick(OPENERS), pick(MIDDLES)];
  if (r() > 0.4) parts.push(pick(CLOSERS));
  return {
    rating,
    author: `${pick(FIRST)} ${LAST[Math.floor(r() * LAST.length)]}.`,
    body: parts.filter(Boolean).join(" "),
  };
}

function addDays(date: string, n: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

let lastSyncDay = "";

export function syncDailyReviews(today = new Date().toISOString().slice(0, 10)) {
  if (lastSyncDay === today) return;
  const d = db();
  const due = d.prepare("SELECT id, review_seed_date FROM products WHERE review_seed_date < ?").all(today) as {
    id: number;
    review_seed_date: string;
  }[];
  if (due.length) {
    const insert = d.prepare(
      "INSERT INTO reviews (product_id, author_name, rating, body, source, created_at) VALUES (?, ?, ?, ?, 'auto', ?)",
    );
    const mark = d.prepare("UPDATE products SET review_seed_date = ? WHERE id = ? AND review_seed_date = ?");
    tx(() => {
      for (const p of due) {
        // Re-check inside the transaction so concurrent workers never double-insert.
        const changed = mark.run(today, p.id, p.review_seed_date);
        if (Number(changed.changes) === 0) continue;
        let day = addDays(p.review_seed_date, 1);
        const earliest = addDays(today, -MAX_CATCHUP_DAYS);
        if (day < earliest) day = earliest;
        for (; day <= today; day = addDays(day, 1)) {
          const r = rng(hash(`${p.id}:${day}`));
          const n = 1 + Math.floor(r() * 10);
          for (let i = 0; i < n; i++) {
            const rev = makeReview(r);
            const start = Date.parse(day + "T00:00:00Z");
            // Today's reviews are spread over the part of the day that has already passed.
            const span = Math.min(86400000, Math.max(60000, Date.now() - start));
            const at = new Date(start + Math.floor(r() * span));
            insert.run(p.id, rev.author, rev.rating, rev.body, at.toISOString());
          }
        }
      }
    });
  }
  lastSyncDay = today;
}

type Row = Record<string, unknown>;
const mapReview = (r: Row): Review => ({
  id: Number(r.id),
  productId: Number(r.product_id),
  authorName: String(r.author_name),
  rating: Number(r.rating),
  body: String(r.body),
  createdAt: String(r.created_at),
  verified: r.source === "customer",
});

export function listReviews(productId: number, limit = 500): Review[] {
  return (
    db()
      .prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(productId, limit) as Row[]
  ).map(mapReview);
}

export function ratingBreakdown(productId: number) {
  const rows = db()
    .prepare("SELECT rating, COUNT(*) c FROM reviews WHERE product_id = ? GROUP BY rating")
    .all(productId) as { rating: number; c: number }[];
  const out: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) out[r.rating] = r.c;
  return out;
}

export function getUserReview(productId: number, userId: number): Review | null {
  const r = db().prepare("SELECT * FROM reviews WHERE product_id = ? AND user_id = ?").get(productId, userId) as
    | Row
    | undefined;
  return r ? mapReview(r) : null;
}

export function upsertCustomerReview(productId: number, userId: number, author: string, rating: number, body: string) {
  db()
    .prepare(
      `INSERT INTO reviews (product_id, user_id, author_name, rating, body, source, created_at)
       VALUES (?, ?, ?, ?, ?, 'customer', ?)
       ON CONFLICT(product_id, user_id) WHERE user_id IS NOT NULL
       DO UPDATE SET rating = excluded.rating, body = excluded.body, created_at = excluded.created_at`,
    )
    .run(productId, userId, author, rating, body, new Date().toISOString());
}
