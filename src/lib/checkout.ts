import "server-only";
import { SITE } from "./config";
import { createLoginToken, findOrCreateUser } from "./auth";
import { sendMail } from "./mail";
import { getOrder, markOrderPaid, orderItems } from "./orders";
import { getProductById } from "./products";
import { money } from "./pricing";

/**
 * Marks an order paid, attaches it to the buyer's account (created on first
 * purchase) and emails a receipt with a sign-in link. Buyers who checked out
 * with just an email are never auto-signed-in: proving the email is theirs
 * happens through that link (or Google sign-in).
 */
export async function finalizeOrder(orderId: number, baseUrl: string) {
  const order = getOrder(orderId);
  if (!order) throw new Error("Order not found");
  const { user } = order.user_id ? { user: { id: order.user_id } } : findOrCreateUser(order.email);
  const first = markOrderPaid(orderId, user.id);
  if (first) {
    const orderUrl = `${baseUrl}/order/${orderId}?key=${order.access_key}`;
    const token = createLoginToken(order.email, "/account", 7 * 24 * 3600 * 1000);
    const items = orderItems(orderId)
      .map((i) => `• ${getProductById(i.product_id)?.title ?? "Project"} — ${money(i.price)}`)
      .join("\n");
    await sendMail(
      order.email,
      `Your ${SITE.name} order #${orderId}`,
      `Thanks for your purchase!\n\n${items}\nTotal: ${money(order.total)}\n\nDownload your files: ${orderUrl}\n\nOpen your library (sign-in link, valid 7 days): ${baseUrl}/api/auth/verify?token=${token}\n\nNext time, just sign in with this email or Google to find all your projects.`,
    );
  }
  return order;
}
