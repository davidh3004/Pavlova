import { useMemo, useState } from 'react';
import type { Lang } from '@/stores/language';

type BaseId = 'medium' | 'large' | 'tiered';

export default function CustomOrderBuilder({ lang }: { lang: Lang }) {
  const es = lang === 'es';

  const bases = [
    {
      id: 'medium' as BaseId,
      name: es ? 'Pavlova Mediana' : 'Medium Pavlova',
      feeds: es ? 'Para 6-8 personas' : 'Feeds 6-8 guests',
      price: 6500,
    },
    {
      id: 'large' as BaseId,
      name: es ? 'Pavlova Grande' : 'Large Pavlova',
      feeds: es ? 'Para 10-12 personas' : 'Feeds 10-12 guests',
      price: 9500,
    },
    {
      id: 'tiered' as BaseId,
      name: es ? 'Torre Personalizada' : 'Custom Tiered',
      feeds: es ? 'Para tu evento' : 'For your event',
      price: null,
    },
  ];

  const fillings = [
    {
      id: 'dulce',
      name: es ? 'Dulce de Leche de la Casa' : 'Signature Dulce de Leche',
      desc: es ? 'Caramelo cremoso suramericano' : 'Creamy South American caramel',
      price: 800,
    },
    {
      id: 'passion',
      name: es ? 'Maracuyá Tropical' : 'Tropical Passion Fruit',
      desc: es ? 'Coulis brillante y ácido' : 'Bright, tangy fruit coulis',
      price: 600,
    },
    {
      id: 'chocolate',
      name: es ? 'Ganache de Chocolate Triple' : 'Triple Chocolate Ganache',
      desc: es ? 'Chocolate belga intenso' : 'Rich Belgian chocolate',
      price: 1000,
    },
    {
      id: 'berry',
      name: es ? 'Mix de Berries Frescos' : 'Fresh Berry Medley',
      desc: es ? 'Fresas, moras y arándanos' : 'Strawberries, blackberries & blueberries',
      price: 700,
    },
  ];

  const times = es
    ? ['Mañana (9:00 AM - 12:00 PM)', 'Tarde (12:00 PM - 3:00 PM)', 'Noche (3:00 PM - 6:00 PM)']
    : ['Morning (9:00 AM - 12:00 PM)', 'Afternoon (12:00 PM - 3:00 PM)', 'Evening (3:00 PM - 6:00 PM)'];

  const [base, setBase] = useState<BaseId>('medium');
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(times[0]);

  const baseObj = bases.find((b) => b.id === base)!;
  const isTiered = base === 'tiered';

  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

  const total = useMemo(() => {
    if (isTiered || baseObj.price === null) return null;
    const add = fillings.filter((f) => selected.includes(f.id)).reduce((s, f) => s + f.price, 0);
    return baseObj.price + add;
  }, [base, selected]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const review = () => {
    const chosen = fillings.filter((f) => selected.includes(f.id)).map((f) => f.name);
    const lines = [
      es ? '¡Hola! Quisiera pedir un postre personalizado:' : "Hi! I'd like to order a custom dessert:",
      `• ${es ? 'Base' : 'Base'}: ${baseObj.name}`,
      chosen.length ? `• ${es ? 'Rellenos' : 'Fillings'}: ${chosen.join(', ')}` : '',
      date ? `• ${es ? 'Fecha de recogida' : 'Pickup date'}: ${date}` : '',
      `• ${es ? 'Hora' : 'Time'}: ${time}`,
      total !== null ? `• ${es ? 'Total estimado' : 'Estimated total'}: ${fmt(total)}` : `• ${es ? 'Precio: a consultar' : 'Pricing: to be confirmed'}`,
    ].filter(Boolean);
    window.open(`https://wa.me/18139305229?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const stepLabel = 'text-[0.6rem] font-bold tracking-[0.22em] uppercase text-[var(--cta)]';
  const boxInput =
    'w-full bg-base-100 border border-[var(--hairline)] rounded-xl px-4 py-2.5 text-sm text-base-content focus:border-[var(--cta)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)]/20 transition';

  return (
    <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12 items-start">
      {/* ── Preview card ── */}
      <div className="lg:sticky lg:top-24 bg-[var(--blush-soft)] rounded-[24px] p-6">
        <div className="overflow-hidden rounded-2xl mb-5">
          <img src="/images/hero-pavlova.png" alt={baseObj.name} className="w-full aspect-square object-cover" />
        </div>
        <p className="text-[0.6rem] font-bold tracking-[0.22em] uppercase text-[var(--cta)] mb-1.5">
          {es ? 'Tu Creación' : 'Your Creation'}
        </p>
        <h3 className="font-serif text-2xl text-base-content leading-tight">{baseObj.name}</h3>
        <p className="text-sm text-base-content/55 mb-5">{es ? 'Pavlova Personalizada' : 'Custom Pavlova'}</p>
        <div className="border-t border-[var(--hairline)] pt-4 flex items-center justify-between">
          <span className="text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/45">
            {es ? 'Total Estimado' : 'Estimated Total'}
          </span>
          <span className="font-serif text-3xl text-base-content">
            {total !== null ? fmt(total) : es ? 'A consultar' : 'Contact us'}
          </span>
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="space-y-10">
        {/* Step 01 — base */}
        <div>
          <p className={stepLabel}>{es ? 'Paso 01' : 'Step 01'}</p>
          <h3 className="font-serif text-2xl text-base-content mt-1 mb-5">{es ? 'Elige Tu Base' : 'Select Your Base'}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {bases.map((b) => {
              const active = base === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBase(b.id)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    active
                      ? 'border-[var(--cta)] bg-[var(--blush-soft)] ring-2 ring-[var(--cta)]/20'
                      : 'border-[var(--hairline)] bg-base-100 hover:border-[var(--cta)]/50'
                  }`}
                >
                  <h4 className="font-serif text-lg text-base-content leading-tight">{b.name}</h4>
                  <p className="text-xs text-base-content/50 mt-1 mb-3">{b.feeds}</p>
                  <span className="text-sm font-bold text-[var(--cta)]">
                    {b.price !== null ? fmt(b.price) : es ? 'A consultar' : 'Contact for pricing'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 02 — fillings */}
        <div>
          <p className={stepLabel}>{es ? 'Paso 02' : 'Step 02'}</p>
          <h3 className="font-serif text-2xl text-base-content mt-1 mb-5">{es ? 'Sabores y Rellenos' : 'Flavors & Fillings'}</h3>
          <div className="space-y-3">
            {fillings.map((f) => {
              const active = selected.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`w-full flex items-center gap-4 text-left rounded-2xl border p-4 transition ${
                    active
                      ? 'border-[var(--cta)] bg-[var(--blush-soft)]'
                      : 'border-[var(--hairline)] bg-base-100 hover:border-[var(--cta)]/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[0.95rem] text-base-content">{f.name}</h4>
                    <p className="text-xs text-base-content/50">{f.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--cta)] shrink-0">+{fmt(f.price)}</span>
                  <span
                    className={`inline-grid place-items-center w-8 h-8 rounded-full shrink-0 transition ${
                      active ? 'bg-[var(--cta)] text-white' : 'bg-[var(--blush-soft)] text-[var(--cta)]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      {active ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 5v14M5 12h14" />}
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 03 — date & time */}
        <div>
          <p className={stepLabel}>{es ? 'Paso 03' : 'Step 03'}</p>
          <h3 className="font-serif text-2xl text-base-content mt-1 mb-5">{es ? 'Fecha y Hora' : 'Date & Time'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/50 mb-2">
                {es ? 'Fecha de Recogida' : 'Pickup Date'}
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${boxInput} cursor-pointer scheme-light`} />
            </div>
            <div>
              <label className="block text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/50 mb-2">
                {es ? 'Hora de Recogida' : 'Pickup Time'}
              </label>
              <div className="relative">
                <select value={time} onChange={(e) => setTime(e.target.value)} className={`${boxInput} appearance-none pr-10 cursor-pointer`}>
                  {times.map((tt) => <option key={tt} value={tt}>{tt}</option>)}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--cta)]">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Review */}
        <div>
          <button
            type="button"
            onClick={review}
            className="w-full inline-flex items-center justify-center rounded-full bg-[var(--cta)] text-white text-[0.72rem] font-bold tracking-[0.2em] uppercase py-4 hover:bg-[var(--cta-hover)] transition-colors"
          >
            {es ? 'Revisar Detalles del Pedido' : 'Review Order Details'}
          </button>
          <p className="flex items-center justify-center gap-2 text-xs text-base-content/45 mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {es ? 'Recogida segura en nuestra tienda' : 'Secure pickup at our store'}
          </p>
        </div>
      </div>
    </div>
  );
}
