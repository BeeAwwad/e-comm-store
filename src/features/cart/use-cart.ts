import { useEffect } from "react";
import { useSelector } from "@tanstack/react-store";
import { cartStore, hydrateCart } from "./cart-store";

export function useCart() {
  const items = useSelector(cartStore, (state) => state.items);
  const hydrated = useSelector(cartStore, (state) => state.hydrated);

  useEffect(() => {
    hydrateCart();
  }, []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotalKobo = items.reduce(
    (total, item) => total + item.priceKobo * item.quantity,
    0,
  );

  return {
    items,
    hydrated,
    itemCount,
    subtotalKobo,
  };
}
