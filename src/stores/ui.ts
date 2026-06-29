import { atom } from 'nanostores';

export const cartDrawerOpen = atom<boolean>(false);

export function openCart() {
  cartDrawerOpen.set(true);
}

export function closeCart() {
  cartDrawerOpen.set(false);
}
