"use client";

import { useEffect } from "react";
import { useStore } from "./store";

/** Empties the cart once an order is confirmed (e.g. after a Stripe redirect). */
export function ClearCart() {
  const { ready, cart, clearCart } = useStore();
  useEffect(() => {
    if (ready && cart.length) clearCart();
  }, [ready, cart.length, clearCart]);
  return null;
}
