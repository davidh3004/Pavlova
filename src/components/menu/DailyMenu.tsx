import { useEffect, useState } from 'react';
import { addToCart } from '@/stores/cart';
import { openCart } from '@/stores/ui';
import type { Lang } from '@/stores/language';

interface MenuItem {
  id: number;
  productId?: number;
  name: string;
  nameEs: string;
  description?: string | null;
  descriptionEs?: string | null;
  price: number | string;
  imageUrl?: string | null;
  available?: boolean;
  soldOut?: boolean;
}

interface Section {
  id: number;
  title: string;
  titleEs?: string;
  items: MenuItem[];
}

interface Menu {
  id: number;
  date: string;
  title?: string;
  titleEs?: string;
  note?: string;
  noteEs?: string;
  sections: Section[];
}

const fallbackImg = '/images/signature-cake.png';

export default function DailyMenu({ lang }: { lang: Lang }) {
  const es = lang === 'es';
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/menus/today')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMenu(data))
      .catch(() => setMenu(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const priceOf = (i: MenuItem) => Number(i.price) || 0;

  const add = (i: MenuItem) => {
    addToCart({
      productId: i.productId ?? i.id,
      name: i.name,
      nameEs: i.nameEs || i.name,
      price: priceOf(i),
      imageUrl: i.imageUrl || undefined,
      quantity: 1,
    });
    openCart();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-28">
        <span className="loading loading-spinner loading-lg text-[var(--cta)]"></span>
      </div>
    );
  }

  if (!menu || !menu.sections?.length) {
    return (
      <div className="container-lux py-24 text-center">
        <p className="eyebrow text-[var(--cta)] mb-3">{es ? 'Menú del Día' : "Today's Menu"}</p>
        <h2 className="font-serif text-3xl lg:text-4xl text-base-content mb-4">
          {es ? 'El menú de hoy llega pronto' : "Today's menu is on its way"}
        </h2>
        <p className="text-base-content/55 mb-8 max-w-md mx-auto">
          {es
            ? 'Mientras tanto, explora todo nuestro menú y ordena para recoger.'
            : 'In the meantime, explore our full menu and order for pickup.'}
        </p>
        <a
          href="/order"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--cta)] text-white text-[0.72rem] font-bold tracking-[0.16em] uppercase px-8 h-12 hover:bg-[var(--cta-hover)] transition-colors"
        >
          {es ? 'Ordenar en Línea' : 'Order Online'}
        </a>
      </div>
    );
  }

  return (
    <div className="bg-base-100 min-h-screen">
      <section className="relative bg-[linear-gradient(160deg,var(--blush-soft)_0%,var(--color-base-100)_70%)] border-b border-[var(--hairline)]">
        <div className="container-lux py-14 lg:py-20 text-center">
          <p className="eyebrow text-[var(--cta)] mb-3">{es ? 'Menú del Día' : "Today's Menu"}</p>
          <h1 className="font-serif text-4xl lg:text-6xl leading-[1.04] text-base-content mb-4">
            {es ? (menu.titleEs || menu.title || 'Menú del Día') : (menu.title || "Today's Menu")}
          </h1>
          {(menu.note || menu.noteEs) && (
            <p className="text-base-content/60 max-w-xl mx-auto">{es ? menu.noteEs || menu.note : menu.note}</p>
          )}
        </div>
      </section>

      <div className="container-lux py-12 lg:py-16 space-y-16">
        {menu.sections.map((section) => (
          <section key={section.id}>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-serif text-2xl lg:text-3xl text-base-content whitespace-nowrap">
                {es ? section.titleEs || section.title : section.title}
              </h2>
              <span className="flex-1 h-px bg-[var(--hairline)]"></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-9">
              {section.items.map((item) => {
                const out = item.soldOut || item.available === false;
                return (
                  <article
                    key={item.id}
                    className={`group flex flex-col rounded-[var(--radius-box)] overflow-hidden bg-base-100 border border-[var(--hairline)] shadow-[var(--shadow-soft)] transition-all duration-300 ${
                      out ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]'
                    }`}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--blush-soft)]">
                      <img
                        src={item.imageUrl || fallbackImg}
                        alt={es ? item.nameEs || item.name : item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="font-serif text-lg leading-snug text-base-content">
                        {es ? item.nameEs || item.name : item.name}
                      </h3>
                      {(item.description || item.descriptionEs) && (
                        <p className="text-sm text-base-content/55 leading-relaxed mt-1.5 line-clamp-2">
                          {es ? item.descriptionEs || item.description : item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4">
                        <span className="font-serif text-xl text-[var(--cta)]">{fmt(priceOf(item))}</span>
                        {out ? (
                          <span className="rounded-full bg-base-200 text-base-content/50 text-[0.66rem] font-bold tracking-[0.14em] uppercase px-4 h-9 inline-flex items-center">
                            {es ? 'Agotado' : 'Sold Out'}
                          </span>
                        ) : (
                          <button
                            onClick={() => add(item)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cta)] text-white text-[0.66rem] font-bold tracking-[0.14em] uppercase px-4 h-9 hover:bg-[var(--cta-hover)] transition-colors"
                          >
                            + {es ? 'Agregar' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <div className="text-center pt-4">
          <a
            href="/order"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--cta)] text-[var(--cta)] text-[0.72rem] font-bold tracking-[0.16em] uppercase px-8 h-12 hover:bg-[var(--cta)] hover:text-white transition-colors"
          >
            {es ? 'Ver Menú Completo' : 'See Full Menu'}
          </a>
        </div>
      </div>
    </div>
  );
}
