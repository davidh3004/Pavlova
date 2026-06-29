import { useState } from 'react';
import { addToCart } from '@/stores/cart';
import type { Lang } from '@/stores/language';

interface MenuItem {
  id: number;
  cat: string;
  name: string;
  nameEs: string;
  price: number; // cents
  desc: string;
  descEs: string;
  image: string;
}

interface Tab {
  id: string;
  en: string;
  es: string;
}

interface Featured {
  id: number;
  name: string;
  nameEs: string;
  price: number;
  image: string;
  desc: string;
  descEs: string;
}

interface MenuPageProps {
  lang: Lang;
  items?: MenuItem[];
  tabs?: Tab[];
  featured?: Featured | null;
}

const fallbackImg = '/images/signature-cake.png';

export default function MenuPage({ lang, items = [], tabs = [], featured = null }: MenuPageProps) {
  const es = lang === 'es';
  const allTabs: Tab[] = [{ id: 'all', en: 'All Flavors', es: 'Todos' }, ...tabs];
  const initialCategory = () => {
    if (typeof window === 'undefined') return 'all';
    const requested = new URLSearchParams(window.location.search).get('category');
    return requested && allTabs.some((t) => t.id === requested) ? requested : 'all';
  };
  const [active, setActive] = useState<string>(initialCategory);

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const nm = (o: { name: string; nameEs: string }) => (es ? o.nameEs : o.name);
  const ds = (o: { desc: string; descEs: string }) => (es ? o.descEs : o.desc);

  const visible = active === 'all' ? items : items.filter((i) => i.cat === active);

  const add = (it: { id: number; name: string; nameEs: string; price: number; image: string }) =>
    addToCart({
      productId: it.id,
      name: it.name,
      nameEs: it.nameEs,
      price: it.price,
      imageUrl: it.image,
      quantity: 1,
    });

  return (
    <div className="bg-base-100">
      {/* FEATURED — Chef's Recommendation (full width) */}
      {featured && (
      <section className="container-lux pt-12 lg:pt-16">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="overflow-hidden rounded-[var(--radius-box)] shadow-[var(--shadow-soft)]">
            <img
              src={featured.image || fallbackImg}
              alt={nm(featured)}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <p className="eyebrow text-[var(--cta)] mb-3">
              {es ? 'Recomendación del Chef' : "Chef's Recommendation"}
            </p>
            <h1 className="font-serif text-4xl lg:text-6xl leading-[1.05] text-base-content mb-5">
              {nm(featured)}
            </h1>
            <p className="text-base text-base-content/60 leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
              {ds(featured)}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-7">
              <span className="font-serif text-4xl text-base-content">{fmt(featured.price)}</span>
              <button
                onClick={() => add({ id: featured.id, name: featured.name, nameEs: featured.nameEs, price: featured.price, image: featured.image })}
                className="btn btn-cta rounded-full text-[0.72rem] tracking-[0.2em] h-12 px-8 inline-flex items-center gap-2 shadow-lg shadow-[var(--cta)]/20"
              >
                {es ? 'Agregar al Pedido' : 'Add to Order'}
              </button>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* FILTER TABS + ITEM LIST */}
      <section className="container-lux pt-14 lg:pt-20 pb-20 lg:pb-28">
        <div className="flex gap-x-8 overflow-x-auto border-b border-[var(--hairline)] mb-10 lg:mb-12 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`relative shrink-0 whitespace-nowrap pb-3 text-[0.7rem] font-bold tracking-[0.18em] uppercase transition-colors ${
                active === tab.id
                  ? 'text-[var(--cta)]'
                  : 'text-base-content/50 hover:text-base-content'
              }`}
            >
              {es ? tab.es : tab.en}
              {active === tab.id && (
                <span className="absolute left-0 bottom-0 h-0.5 w-full bg-[var(--cta)]" />
              )}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16 rounded-[var(--radius-box)] bg-base-200/50 border border-[var(--hairline)]">
            <p className="font-serif text-2xl text-base-content/40">
              {es ? 'Menú disponible próximamente' : 'Menu coming soon'}
            </p>
          </div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-10 gap-y-10 lg:gap-y-12">
          {visible.map((item, idx) => (
            <button
              key={`${active}-${item.id}`}
              onClick={() => add(item)}
              className="group flex flex-col text-left anim-pop"
              style={{ animationDelay: `${Math.min(idx, 8) * 0.05}s` }}
            >
              <div className="w-full overflow-hidden rounded-[var(--radius-box)] bg-base-200 shadow-[var(--shadow-soft)] mb-4">
                <img
                  src={item.image || fallbackImg}
                  alt={nm(item)}
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg lg:text-xl leading-snug text-base-content group-hover:text-[var(--cta)] transition-colors">
                  {nm(item)}
                </h3>
                <div className="flex items-center gap-2 shrink-0 pt-2">
                  <span className="w-5 border-b border-dotted border-base-content/30" />
                  <span className="font-serif text-sm lg:text-base text-[var(--cta)]">{fmt(item.price)}</span>
                </div>
              </div>
              <p className="text-[0.85rem] text-base-content/55 leading-relaxed mt-2.5">
                {ds(item)}
              </p>
              <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold tracking-[0.18em] uppercase text-[var(--cta)] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                + {es ? 'Agregar' : 'Add'}
              </span>
            </button>
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
