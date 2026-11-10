import "server-only";
import { LICENSES, type LicenseCode } from "./config";
import { db, nowIso, tx } from "./db";
import { applyBundleDiscounts, availableFormats, unitPrice } from "./pricing";
import { getProductById } from "./products";
import { randomToken } from "./auth";
import type { CartItem, Format, Product } from "./types";

export interface QuotedLine {
  product: Product;
  format: Format;
  license: LicenseCode;
  unit: number;
  discountPercent: number;
  total: number;
}

/** Validates cart items against the catalog and prices them server-side. */
export function quote(items: unknown) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) throw new Error("Your cart is empty.");
  const seen = new Set<number>();
  const valid: { item: { product: Product; format: Format; license: LicenseCode }; unit: number }[] = [];
  for (const raw of items as CartItem[]) {
    const product = getProductById(Number(raw?.productId));
    if (!product || seen.has(product.id)) continue;
    const format = raw.format as Format;
    const license = raw.license as LicenseCode;
    if (!availableFormats(product).includes(format) || !(license in LICENSES)) continue;
    seen.add(product.id);
    valid.push({ item: { product, format, license }, unit: unitPrice(product, format, license) });
  }
  if (!valid.length) throw new Error("Your cart is empty.");
  const priced = applyBundleDiscounts(valid);
  const lines: QuotedLine[] = priced.lines.map((l) => ({
    ...l.item,
    unit: l.unit,
    discountPercent: l.discountPercent,
    total: l.total,
  }));
  return { lines, subtotal: priced.subtotal, discount: priced.discount, total: priced.total };
}

export function createOrder(email: string, userId: number | null, q: ReturnType<typeof quote>, provider: string) {
  return tx(() => {
    const d = db();
    const accessKey = randomToken(24);
    const res = d
      .prepare(
        `INSERT INTO orders (user_id, email, status, subtotal, discount, total, access_key, provider, created_at)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, email, q.subtotal, q.discount, q.total, accessKey, provider, nowIso());
    const orderId = Number(res.lastInsertRowid);
    const ins = d.prepare(
      `INSERT INTO order_items (order_id, product_id, format, license, unit_price, discount_percent, price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const l of q.lines) ins.run(orderId, l.product.id, l.format, l.license, l.unit, l.discountPercent, l.total);
    return { orderId, accessKey };
  });
}

export interface OrderRow {
  id: number;
  user_id: number | null;
  email: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  access_key: string;
  provider: string;
  provider_ref: string | null;
  created_at: string;
  paid_at: string | null;
}

export function getOrder(id: number) {
  return (db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as unknown as OrderRow | undefined) ?? null;
}

export function setOrderRef(id: number, ref: string) {
  db().prepare("UPDATE orders SET provider_ref = ? WHERE id = ?").run(ref, id);
}

/** Marks the order paid exactly once and links it to the buyer's account. */
export function markOrderPaid(id: number, userId: number) {
  return tx(() => {
    const d = db();
    const r = d
      .prepare("UPDATE orders SET status = 'paid', paid_at = ?, user_id = ? WHERE id = ? AND status = 'pending'")
      .run(nowIso(), userId, id);
    if (Number(r.changes) > 0) {
      d.prepare(
        "UPDATE products SET sales = sales + 1 WHERE id IN (SELECT product_id FROM order_items WHERE order_id = ?)",
      ).run(id);
    }
    return Number(r.changes) > 0;
  });
}

export function countPaidOrders(userId: number) {
  return (db().prepare("SELECT COUNT(*) c FROM orders WHERE user_id = ? AND status = 'paid'").get(userId) as { c: number }).c;
}

export interface PurchaseRow {
  item_id: number;
  order_id: number;
  product_id: number;
  format: Format;
  license: LicenseCode;
  price: number;
  paid_at: string;
}

export function orderItems(orderId: number) {
  return db()
    .prepare(
      `SELECT oi.id item_id, oi.order_id, oi.product_id, oi.format, oi.license, oi.price, o.paid_at
       FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.order_id = ?`,
    )
    .all(orderId) as unknown as PurchaseRow[];
}

export function userPurchases(userId: number) {
  return db()
    .prepare(
      `SELECT oi.id item_id, oi.order_id, oi.product_id, oi.format, oi.license, oi.price, o.paid_at
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND o.status = 'paid' ORDER BY o.paid_at DESC`,
    )
    .all(userId) as unknown as PurchaseRow[];
}

export function hasPurchased(userId: number, productId: number) {
  return !!db()
    .prepare(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND o.status = 'paid' AND oi.product_id = ? LIMIT 1`,
    )
    .get(userId, productId);
}

export function getPurchaseItem(itemId: number) {
  return (
    (db()
      .prepare(
        `SELECT oi.id item_id, oi.order_id, oi.product_id, oi.format, oi.license, oi.price, o.paid_at,
                o.user_id, o.access_key, o.status
         FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.id = ?`,
      )
      .get(itemId) as unknown as (PurchaseRow & { user_id: number | null; access_key: string; status: string }) | undefined) ??
    null
  );
}
