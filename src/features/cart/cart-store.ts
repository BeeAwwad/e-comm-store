import { Store } from "@tanstack/react-store";

export type CartItem = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  size: string;
  color: string;
  priceKobo: number;
  quantity: number;
  stock: number;
};

type CartState = {
  hydrated: boolean;
  items: CartItem[];
};

const STORAGE_KEY = "clothing-store-cart-v1";

export const cartStore = new Store<CartState>({
  hydrated: false,
  items: [],
});

function save(items: CartItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function hydrateCart() {
  if (typeof window === "undefined") return;
  if (cartStore.state.hydrated) return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as CartItem[]) : [];

    cartStore.setState(() => ({
      hydrated: true,
      items,
    }));
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);

    cartStore.setState(() => ({
      hydrated: true,
      items: [],
    }));
  }
}

export function addCartItem(item: CartItem) {
  cartStore.setState((state) => {
    const existing = state.items.find(
      (current) => current.variantId === item.variantId,
    );

    const items = existing
      ? state.items.map((current) =>
          current.variantId === item.variantId
            ? {
                ...current,
                quantity: Math.min(
                  current.quantity + item.quantity,
                  current.stock,
                ),
              }
            : current,
        )
      : [...state.items, item];

    save(items);

    return {
      ...state,
      items,
    };
  });
}

export function updateCartQuantity(variantId: string, quantity: number) {
  cartStore.setState((state) => {
    const items =
      quantity <= 0
        ? state.items.filter((item) => item.variantId !== variantId)
        : state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.min(quantity, item.stock),
                }
              : item,
          );

    save(items);

    return {
      ...state,
      items,
    };
  });
}

export function removeCartItem(variantId: string) {
  updateCartQuantity(variantId, 0);
}

export function clearCart() {
  save([]);

  cartStore.setState((state) => ({
    ...state,
    items: [],
  }));
}
