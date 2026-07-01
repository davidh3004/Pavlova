import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Lang } from '@/stores/language';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  dessertType: z.string().min(1),
  size: z.string().min(1),
  flavors: z.string().min(3),
  occasion: z.string().optional(),
  neededBy: z.string().min(1),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const labels = {
  en: {
    name: 'Your Name', email: 'Email', phone: 'Phone', type: 'Dessert Type', size: 'Size / Servings',
    flavors: 'Flavors & Preferences', occasion: 'Occasion (optional)', neededBy: 'Needed By',
    imageUrl: 'Inspiration Image URL (optional)', notes: 'Additional Notes (optional)',
    submit: 'Submit Request', sending: 'Sending...', success: "Request received! We'll get back to you within 24 hours.",
    selectType: 'Select type...', types: ['Pavlova', 'Cake', 'Pastry Assortment', 'Tres Leches', 'Other'],
  },
  es: {
    name: 'Tu Nombre', email: 'Correo', phone: 'Teléfono', type: 'Tipo de Postre', size: 'Tamaño / Porciones',
    flavors: 'Sabores y Preferencias', occasion: 'Ocasión (opcional)', neededBy: 'Lo Necesito Para',
    imageUrl: 'URL de Imagen de Inspiración (opcional)', notes: 'Notas Adicionales (opcional)',
    submit: 'Enviar Solicitud', sending: 'Enviando...', success: '¡Solicitud recibida! Te responderemos en 24 horas.',
    selectType: 'Selecciona el tipo...', types: ['Pavlova', 'Torta', 'Bandeja de Pasteles', 'Tres Leches', 'Otro'],
  },
};

export default function CustomOrderForm({ lang }: { lang: Lang }) {
  const lbl = labels[lang] || labels.en;
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/inquiries/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { setSuccess(true); reset(); }
      else setServerError(lang === 'es' ? 'Error al enviar.' : 'Failed to send. Please try again.');
    } catch {
      setServerError(lang === 'es' ? 'Error de conexión.' : 'Connection error.');
    }
  };

  const inputCls = 'w-full bg-base-100 border border-[var(--hairline)] rounded-xl px-4 py-3 text-sm text-base-content placeholder:text-base-content/35 focus:border-[var(--cta)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)]/20 transition';
  const fieldLabel = 'block text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/50 mb-2';
  const errCls = '!border-[var(--rose)] focus:!ring-[var(--rose)]/20';
  const errText = (msg: string) => <p className="text-xs text-[var(--rose)] mt-1.5">{msg}</p>;

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="grid place-items-center w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--blush-soft)] text-[var(--cta)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl text-base-content mb-2">{lang === 'es' ? '¡Solicitud Recibida!' : 'Request Received!'}</h3>
        <p className="text-base-content/60 text-sm max-w-sm mx-auto">{lbl.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/30 px-4 py-3 text-sm text-[var(--rose)]">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={fieldLabel}>{lbl.name}</label>
          <input {...register('name')} className={`${inputCls} ${errors.name ? errCls : ''}`} placeholder={lang === 'es' ? 'Tu nombre completo' : 'Your full name'} />
          {errors.name && errText(lang === 'es' ? 'Ingresa tu nombre' : 'Please enter your name')}
        </div>
        <div>
          <label className={fieldLabel}>{lbl.phone}</label>
          <input {...register('phone')} type="tel" className={`${inputCls} ${errors.phone ? errCls : ''}`} placeholder="(407) 000-0000" />
          {errors.phone && errText(lang === 'es' ? 'Ingresa tu teléfono' : 'Please enter your phone')}
        </div>
      </div>

      <div>
        <label className={fieldLabel}>{lbl.email}</label>
        <input {...register('email')} type="email" className={`${inputCls} ${errors.email ? errCls : ''}`} placeholder="you@email.com" />
        {errors.email && errText(lang === 'es' ? 'Correo inválido' : 'Invalid email address')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={fieldLabel}>{lbl.type}</label>
          <div className="relative">
            <select {...register('dessertType')} className={`${inputCls} appearance-none pr-10 cursor-pointer ${errors.dessertType ? errCls : ''}`}>
              <option value="">{lbl.selectType}</option>
              {lbl.types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40"><path d="M6 9l6 6 6-6" /></svg>
          </div>
          {errors.dessertType && errText(lang === 'es' ? 'Selecciona un tipo' : 'Please select a type')}
        </div>
        <div>
          <label className={fieldLabel}>{lbl.size}</label>
          <input {...register('size')} className={`${inputCls} ${errors.size ? errCls : ''}`} placeholder={lang === 'es' ? 'ej. 8 porciones' : 'e.g. 8 servings'} />
          {errors.size && errText(lang === 'es' ? 'Indica el tamaño' : 'Please enter a size')}
        </div>
      </div>

      <div>
        <label className={fieldLabel}>{lbl.flavors}</label>
        <textarea {...register('flavors')} rows={3} className={`${inputCls} resize-none ${errors.flavors ? errCls : ''}`} placeholder={lang === 'es' ? 'ej. Frutos del bosque, crema chantilly, sin gluten...' : 'e.g. Mixed berries, chantilly cream, gluten-free...'} />
        {errors.flavors && errText(lang === 'es' ? 'Cuéntanos tus sabores' : 'Tell us your flavors')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={fieldLabel}>{lbl.occasion}</label>
          <input {...register('occasion')} className={inputCls} placeholder={lang === 'es' ? 'Cumpleaños, boda...' : 'Birthday, wedding...'} />
        </div>
        <div>
          <label className={fieldLabel}>{lbl.neededBy}</label>
          <input {...register('neededBy')} type="date" className={`${inputCls} cursor-pointer ${errors.neededBy ? errCls : ''}`} />
          {errors.neededBy && errText(lang === 'es' ? 'Elige una fecha' : 'Please choose a date')}
        </div>
      </div>

      <div>
        <label className={fieldLabel}>{lbl.imageUrl}</label>
        <input {...register('imageUrl')} type="url" className={inputCls} placeholder="https://..." />
      </div>

      <div>
        <label className={fieldLabel}>{lbl.notes}</label>
        <textarea {...register('notes')} rows={3} className={`${inputCls} resize-none`} placeholder={lang === 'es' ? 'Cualquier detalle adicional...' : 'Any additional details...'} />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--cta)] text-white text-[0.72rem] font-bold tracking-[0.2em] uppercase py-4 hover:bg-[var(--cta-hover)] disabled:opacity-60 transition-colors shadow-lg shadow-[var(--cta)]/20"
        disabled={isSubmitting}
      >
        {isSubmitting && <span className="loading loading-spinner loading-sm"></span>}
        {isSubmitting ? lbl.sending : lbl.submit}
      </button>
    </form>
  );
}
