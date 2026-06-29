import { atom, computed } from 'nanostores';

export interface CartItem {
  cartItemId: string;
  productId: number;
  name: string;
  nameEs: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  specialInstructions?: string;
}

const CART_KEY = 'pavlova_cart';

function loadCart(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}

export const cartItems = atom<CartItem[]>(
  typeof localStorage !== 'undefined' ? loadCart() : []
);

export const cartCount = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export function addToCart(item: Omit<CartItem, 'cartItemId'>) {
  const existing = cartItems.get().find(
    (i) => i.productId === item.productId &&
           i.specialInstructions === item.specialInstructions
  );
  if (existing) {
    updateQuantity(existing.cartItemId, existing.quantity + item.quantity);
  } else {
    const newItem: CartItem = {
      ...item,
      cartItemId: `${item.productId}-${Date.now()}`,
    };
    const updated = [...cartItems.get(), newItem];
    cartItems.set(updated);
    saveCart(updated);
  }
}

export function removeFromCart(cartItemId: string) {
  const updated = cartItems.get().filter((i) => i.cartItemId !== cartItemId);
  cartItems.set(updated);
  saveCart(updated);
}

export function updateQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  const updated = cartItems.get().map((i) =>
    i.cartItemId === cartItemId ? { ...i, quantity } : i
  );
  cartItems.set(updated);
  saveCart(updated);
}

export function clearCart() {
  cartItems.set([]);
  saveCart([]);
}
