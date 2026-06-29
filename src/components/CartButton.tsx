import { useStore } from '@nanostores/react';
import { cartCount } from '@/stores/cart';
import { openCart } from '@/stores/ui';
import type { Lang } from '@/stores/language';

interface Props {
  lang: Lang;
}

export default function CartButton({ lang }: Props) {
  const count = useStore(cartCount);

  return (
    <button
      onClick={openCart}
      className="relative grid place-items-center w-10 h-10 rounded-lg text-base-content/80 hover:bg-base-200 hover:text-primary transition-colors"
      aria-label={lang === 'es' ? 'Carrito' : 'Cart'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-[21px] w-[21px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: 'var(--cta)' }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
