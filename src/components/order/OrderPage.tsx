import { useState, useEffect } from 'react';
import { addToCart } from '@/stores/cart';
import { openCart } from '@/stores/ui';
import type { Lang } from '@/stores/language';

interface Product {
  id: number;
  name: string;
  nameEs: string;
  description?: string | null;
  descriptionEs?: string | null;
  price: number | string;
  imageUrl?: string | null;
  available: boolean;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
  nameEs: string;
}

const labels = {
  en: {
    eyebrow: 'Order Online · Pickup',
    title: 'Order Online',
    subtitle: 'Pickup at 3909 W Broad St, Tampa, FL',
    all: 'All',
    add: 'Add',
    soldOut: 'Sold Out',
    qty: 'Quantity',
    instructions: 'Special instructions (optional)',
    addToOrder: 'Add to Order',
    cancel: 'Cancel',
    viewCart: 'View Cart',
    each: 'each',
    empty: 'No items in this category',
    error: 'Failed to load products.',
    placeholder: 'Gluten-free, no sugar...',
    search: 'Search the menu...',
  },
  es: {
    eyebrow: 'Ordena en Línea · Recogida',
    title: 'Ordenar en Línea',
    subtitle: 'Recogida en 3909 W Broad St, Tampa, FL',
    all: 'Todo',
    add: 'Agregar',
    soldOut: 'Agotado',
    qty: 'Cantidad',
    instructions: 'Instrucciones especiales (opcional)',
    addToOrder: 'Agregar al Pedido',
    cancel: 'Cancelar',
    viewCart: 'Ver Carrito',
    each: 'c/u',
    empty: 'Sin productos en esta categoría',
    error: 'Error al cargar productos.',
    placeholder: 'Sin gluten, sin azúcar...',
    search: 'Buscar en el menú...',
  },
};

const fallbackImg = '/images/signature-cake.png';

export default function OrderPage({ lang }: { lang: Lang }) {
  const es = lang === 'es';
  const lbl = labels[lang] || labels.en;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?available=true'),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
      } catch {
        setError(lbl.error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (activeCategory && p.categoryId !== activeCategory) return false;
    if (!q) return true;
    return [p.name, p.nameEs, p.description, p.descriptionEs]
      .some((v) => (v || '').toLowerCase().includes(q));
  });

  const priceOf = (p: Product) => Number(p.price) || 0;
  const fmtPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const nm = (p: Product) => (es ? p.nameEs || p.name : p.name);
  const ds = (p: Product) => (es ? p.descriptionEs || p.description : p.description) || '';

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setQty(1);
    setInstructions('');
  };
  const closeModal = () => setSelectedProduct(null);

  const handleAdd = () => {
    if (!selectedProduct) return;
    addToCart({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      nameEs: selectedProduct.nameEs,
      price: priceOf(selectedProduct),
      imageUrl: selectedProduct.imageUrl || undefined,
      quantity: qty,
      specialInstructions: instructions || undefined,
    });
    closeModal();
    openCart();
  };

  return (
    <div className="bg-base-100 min-h-screen">
      {/* Hero */}
      <section className="relative bg-[linear-gradient(160deg,var(--blush-soft)_0%,var(--color-base-100)_70%)] border-b border-[var(--hairline)]">
        <div className="container-lux py-14 lg:py-20 text-center">
          <p className="eyebrow text-[var(--cta)] mb-3">{lbl.eyebrow}</p>
          <h1 className="font-serif text-4xl lg:text-6xl leading-[1.04] text-base-content mb-4">
            {lbl.title}
          </h1>
          <p className="text-base-content/60">{lbl.subtitle}</p>
        </div>
      </section>

      {/* Sticky search + category tabs */}
      <div className="sticky top-20 lg:top-24 z-30 bg-base-100/90 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="container-lux">
          <div className="py-3 space-y-3">
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lbl.search}
                aria-label={lbl.search}
                className="w-full rounded-full border border-[var(--hairline)] bg-base-100 pl-11 pr-4 h-11 text-sm text-base-content placeholder:text-base-content/40 focus:border-[var(--cta)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)]/15 transition-all"
              />
            </div>
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full px-5 h-9 text-[0.7rem] font-bold tracking-[0.12em] uppercase transition-colors ${
                  activeCategory === null
                    ? 'bg-[var(--cta)] text-white'
                    : 'bg-[var(--blush-soft)] text-base-content/70 hover:text-[var(--cta)]'
                }`}
              >
                {lbl.all}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-5 h-9 text-[0.7rem] font-bold tracking-[0.12em] uppercase whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[var(--cta)] text-white'
                      : 'bg-[var(--blush-soft)] text-base-content/70 hover:text-[var(--cta)]'
                  }`}
                >
                  {es ? cat.nameEs || cat.name : cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <section className="container-lux py-12 lg:py-16">
        {loading && (
          <div className="flex justify-center py-24">
            <span className="loading loading-spinner loading-lg text-[var(--cta)]"></span>
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto text-center rounded-[var(--radius-field)] border border-[var(--cta)]/30 bg-[var(--cta)]/5 px-6 py-4 text-[var(--cta)]">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-24 text-base-content/40">
            <p>{lbl.empty}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-9">
            {filtered.map((product) => (
              <article
                key={product.id}
                className={`group flex flex-col rounded-[var(--radius-box)] overflow-hidden bg-base-100 border border-[var(--hairline)] shadow-[var(--shadow-soft)] transition-all duration-300 ${
                  product.available ? 'hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] cursor-pointer' : 'opacity-60'
                }`}
                onClick={() => product.available && openModal(product)}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[var(--blush-soft)]">
                  <img
                    src={product.imageUrl || fallbackImg}
                    alt={nm(product)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-serif text-lg leading-snug text-base-content">{nm(product)}</h3>
                  {ds(product) && (
                    <p className="text-sm text-base-content/55 leading-relaxed mt-1.5 line-clamp-2">{ds(product)}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="font-serif text-xl text-[var(--cta)]">{fmtPrice(priceOf(product))}</span>
                    {product.available ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cta)] text-white text-[0.66rem] font-bold tracking-[0.14em] uppercase px-4 h-9 group-hover:bg-[var(--cta-hover)] transition-colors">
                        + {lbl.add}
                      </span>
                    ) : (
                      <span className="rounded-full bg-base-200 text-base-content/50 text-[0.66rem] font-bold tracking-[0.14em] uppercase px-4 h-9 inline-flex items-center">
                        {lbl.soldOut}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Add to cart modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#4d2236]/55 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative w-full max-w-sm rounded-[var(--radius-box)] bg-base-100 shadow-[var(--shadow-lift)] overflow-hidden">
            <img
              src={selectedProduct.imageUrl || fallbackImg}
              alt={nm(selectedProduct)}
              className="w-full h-44 object-cover"
            />
            <div className="p-6">
              <h3 className="font-serif text-2xl text-base-content mb-1">{nm(selectedProduct)}</h3>
              {ds(selectedProduct) && (
                <p className="text-sm text-base-content/55 mb-4">{ds(selectedProduct)}</p>
              )}
              <p className="font-serif text-xl text-[var(--cta)] mb-5">
                {fmtPrice(priceOf(selectedProduct))} <span className="text-sm text-base-content/45">{lbl.each}</span>
              </p>

              <div className="mb-4">
                <span className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-base-content/60 mb-2">{lbl.qty}</span>
                <div className="flex items-center gap-4">
                  <button
                    className="w-9 h-9 grid place-items-center rounded-full border border-[var(--hairline)] text-base-content hover:border-[var(--cta)] hover:text-[var(--cta)] transition-colors"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >–</button>
                  <span className="font-serif text-lg w-8 text-center">{qty}</span>
                  <button
                    className="w-9 h-9 grid place-items-center rounded-full border border-[var(--hairline)] text-base-content hover:border-[var(--cta)] hover:text-[var(--cta)] transition-colors"
                    onClick={() => setQty(qty + 1)}
                  >+</button>
                </div>
              </div>

              <div className="mb-6">
                <span className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-base-content/60 mb-2">{lbl.instructions}</span>
                <textarea
                  className="w-full rounded-[var(--radius-field)] border border-[var(--hairline)] bg-base-100 px-3.5 py-2.5 text-sm focus:border-[var(--cta)] focus:outline-none transition-colors"
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={lbl.placeholder}
                />
              </div>

              <div className="flex items-center justify-between mb-5 pt-4 border-t border-[var(--hairline)]">
                <span className="text-sm font-medium text-base-content/70">Subtotal</span>
                <span className="font-serif text-xl text-base-content">{fmtPrice(priceOf(selectedProduct) * qty)}</span>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 h-11 rounded-full border border-[var(--hairline)] text-base-content text-[0.7rem] font-bold tracking-[0.14em] uppercase hover:bg-base-200 transition-colors"
                  onClick={closeModal}
                >{lbl.cancel}</button>
                <button
                  className="flex-1 h-11 rounded-full bg-[var(--cta)] text-white text-[0.7rem] font-bold tracking-[0.14em] uppercase hover:bg-[var(--cta-hover)] transition-colors"
                  onClick={handleAdd}
                >{lbl.addToOrder}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
