import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Lang } from '@/stores/language';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  eventDate: z.string().optional(),
  eventType: z.string().min(1),
  guestCount: z.string().min(1),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const eventTypes = {
  en: ['Wedding', 'Corporate Event', 'Birthday Party', 'Quinceañera', 'Social Gathering', 'Holiday Party', 'Other'],
  es: ['Boda', 'Evento Corporativo', 'Fiesta de Cumpleaños', 'Quinceañera', 'Reunión Social', 'Fiesta de Temporada', 'Otro'],
};

const labels = {
  en: {
    name: 'Full Name',
    namePh: 'Grace Miller',
    email: 'Email Address',
    emailPh: 'grace@example.com',
    date: 'Event Date',
    type: 'Event Type',
    guests: 'Estimated Guest Count',
    guestsMin: '10 Guests',
    guestsMax: '500+ Guests',
    guestUnit: 'guests',
    message: 'Message & Vision',
    messagePh: 'Tell us about the mood, theme, and dietary requirements…',
    submit: 'Submit Inquiry',
    sending: 'Sending…',
    success: "Request received! We'll contact you within 24 hours.",
  },
  es: {
    name: 'Nombre Completo',
    namePh: 'Grace Miller',
    email: 'Correo Electrónico',
    emailPh: 'grace@ejemplo.com',
    date: 'Fecha del Evento',
    type: 'Tipo de Evento',
    guests: 'Número Estimado de Invitados',
    guestsMin: '10 Invitados',
    guestsMax: '500+ Invitados',
    guestUnit: 'invitados',
    message: 'Mensaje y Visión',
    messagePh: 'Cuéntanos sobre el ambiente, el tema y los requisitos dietéticos…',
    submit: 'Enviar Solicitud',
    sending: 'Enviando…',
    success: '¡Solicitud recibida! Te contactaremos en 24 horas.',
  },
};

const fieldLabel = 'block text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/50 mb-2';
const fieldInput =
  'w-full bg-transparent border-0 border-b border-[var(--hairline)] rounded-none px-0 py-2 text-base-content placeholder:text-base-content/30 focus:border-[var(--cta)] focus:outline-none transition-colors';
// Boxed style for date & select so they read clearly as pickers
const boxInput =
  'w-full bg-base-100 border border-[var(--hairline)] rounded-xl px-4 py-2.5 text-sm text-base-content focus:border-[var(--cta)] focus:outline-none focus:ring-2 focus:ring-[var(--cta)]/20 transition';

export default function CateringForm({ lang }: { lang: Lang }) {
  const lbl = labels[lang] || labels.en;
  const types = eventTypes[lang] || eventTypes.en;
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [guests, setGuests] = useState(50);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventType: types[0], guestCount: '50' },
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/inquiries/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { setSuccess(true); reset(); }
      else setServerError(lang === 'es' ? 'Error al enviar.' : 'Failed to send.');
    } catch {
      setServerError(lang === 'es' ? 'Error de conexión.' : 'Connection error.');
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-[var(--cta)]/10 border border-[var(--cta)]/20 text-[var(--cta)] px-5 py-4 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">{lbl.success}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{serverError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={fieldLabel}>{lbl.name}</label>
          <input {...register('name')} placeholder={lbl.namePh} className={fieldInput} />
        </div>
        <div>
          <label className={fieldLabel}>{lbl.email}</label>
          <input {...register('email')} type="email" placeholder={lbl.emailPh} className={fieldInput} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={fieldLabel}>{lbl.date}</label>
          <input {...register('eventDate')} type="date" className={`${boxInput} cursor-pointer scheme-light`} />
        </div>
        <div>
          <label className={fieldLabel}>{lbl.type}</label>
          <div className="relative">
            <select {...register('eventType')} className={`${boxInput} appearance-none pr-10 cursor-pointer`}>
              {types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--cta)]">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className={`${fieldLabel} mb-0`}>{lbl.guests}</label>
          <span className="text-sm font-bold text-[var(--cta)]">{guests >= 500 ? '500+' : guests} {lbl.guestUnit}</span>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          step={5}
          defaultValue={50}
          {...register('guestCount', { onChange: (e) => setGuests(Number(e.target.value)) })}
          className="w-full accent-[var(--cta)] cursor-pointer"
        />
        <div className="flex justify-between text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-base-content/40 mt-2">
          <span>{lbl.guestsMin}</span>
          <span>{lbl.guestsMax}</span>
        </div>
      </div>

      <div>
        <label className={fieldLabel}>{lbl.message}</label>
        <textarea {...register('message')} rows={3} placeholder={lbl.messagePh} className={`${fieldInput} resize-none leading-relaxed`} />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center rounded-full bg-[var(--cta)] text-white text-[0.7rem] font-bold tracking-[0.2em] uppercase py-4 hover:bg-[var(--cta-hover)] transition-colors disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? lbl.sending : lbl.submit}
      </button>
    </form>
  );
}
