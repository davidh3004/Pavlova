import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, removeFromCart, updateQuantity } from '@/stores/cart';
import { cartDrawerOpen, closeCart } from '@/stores/ui';
import type { Lang } from '@/stores/language';

interface Props {
  lang: Lang;
}

const labels = {
  en: {
    title: 'Your Order',
    empty: 'Your cart is empty',
    emptySubtitle: 'Browse our menu and add items to start your order',
    subtotal: 'Subtotal',
    checkout: 'Go to Checkout',
    continueShopping: 'Continue Shopping',
    remove: 'Remove',
    each: 'each',
  },
  es: {
    title: 'Tu Pedido',
    empty: 'Tu carrito está vacío',
    emptySubtitle: 'Explora nuestro menú y agrega artículos para comenzar tu pedido',
    subtotal: 'Subtotal',
    checkout: 'Proceder al Pago',
    continueShopping: 'Seguir Comprando',
    remove: 'Eliminar',
    each: 'c/u',
  },
};

export default function CartDrawer({ lang }: Props) {
  const isOpen = useStore(cartDrawerOpen);
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const lbl = labels[lang] || labels.en;

  const fmtPrice = (cents: number) =>
    `$${(cents / 100).toFixed(2)}`;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-base-100 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h2 className="font-serif text-xl font-bold text-base-content">{lbl.title}</h2>
          <button onClick={closeCart} className="btn btn-ghost btn-sm btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="grid place-items-center w-16 h-16 rounded-full bg-[var(--blush-soft)] text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </div>
              <div>
                <p className="font-serif text-xl text-base-content">{lbl.empty}</p>
                <p className="text-sm text-base-content/50 mt-1">{lbl.emptySubtitle}</p>
              </div>
              <button onClick={closeCart} className="btn btn-quiet btn-sm mt-2">
                {lbl.continueShopping}
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.cartItemId} className="flex gap-3">
                  {/* Image */}
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={lang === 'es' ? item.nameEs : item.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  {!item.imageUrl && (
                    <div className="w-16 h-16 bg-[var(--blush-soft)] text-primary/40 rounded-lg flex-shrink-0 grid place-items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}><path d="M7 14h10l-1 7H8zM12 3c2 2 3 4 3 6a3 3 0 0 1-6 0c0-2 1-4 3-6z"/></svg>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug line-clamp-2">
                      {lang === 'es' ? item.nameEs : item.name}
                    </p>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {fmtPrice(item.price)} {lbl.each}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-xs text-base-content/40 italic mt-0.5 line-clamp-1">
                        {item.specialInstructions}
                      </p>
                    )}

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="btn btn-xs btn-ghost btn-circle"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      >
                        –
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        className="btn btn-xs btn-ghost btn-circle"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-xs btn-ghost text-error ml-auto"
                        onClick={() => removeFromCart(item.cartItemId)}
                      >
                        {lbl.remove}
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <div className="text-sm font-bold text-base-content flex-shrink-0">
                    {fmtPrice(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-base-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-base-content/70">{lbl.subtotal}</span>
              <span className="font-bold text-lg">{fmtPrice(total)}</span>
            </div>
            <a
              href="/checkout"
              className="btn btn-cta w-full"
              onClick={closeCart}
            >
              {lbl.checkout}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
