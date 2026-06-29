import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Lang } from '@/stores/language';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
});

type FormData = z.infer<typeof schema>;

const subjects = {
  en: ['General Inquiry', 'Catering', 'Custom Order', 'Feedback', 'Other'],
  es: ['Consulta General', 'Catering', 'Pedido Personalizado', 'Comentarios', 'Otro'],
};

const labels = {
  en: {
    name: 'Full Name',
    namePh: 'Grace Miller',
    email: 'Email Address',
    emailPh: 'hello@example.com',
    subject: 'Subject',
    message: 'Your Message',
    messagePh: 'How can we make your day sweeter?',
    send: 'Send Message',
    sending: 'Sending…',
    success: "Message sent! We'll get back to you soon.",
  },
  es: {
    name: 'Nombre Completo',
    namePh: 'Grace Miller',
    email: 'Correo Electrónico',
    emailPh: 'hola@ejemplo.com',
    subject: 'Asunto',
    message: 'Tu Mensaje',
    messagePh: '¿Cómo podemos endulzar tu día?',
    send: 'Enviar Mensaje',
    sending: 'Enviando…',
    success: '¡Mensaje enviado! Te responderemos pronto.',
  },
};

const fieldLabel = 'block text-[0.6rem] font-bold tracking-[0.18em] uppercase text-base-content/50 mb-2';
const fieldInput =
  'w-full bg-transparent border-0 border-b border-[var(--hairline)] rounded-none px-0 py-2 text-base-content placeholder:text-base-content/30 focus:border-[var(--cta)] focus:outline-none transition-colors';

export default function ContactForm({ lang }: { lang: Lang }) {
  const es = lang === 'es';
  const lbl = labels[lang] || labels.en;
  const subs = subjects[lang] || subjects.en;
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject: subs[0] },
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/inquiries/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSuccess(true);
        reset();
      } else {
        setServerError(es ? 'Error al enviar. Intenta de nuevo.' : 'Failed to send. Please try again.');
      }
    } catch {
      setServerError(es ? 'Error de conexión.' : 'Connection error. Please try again.');
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{serverError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={fieldLabel}>{lbl.name}</label>
          <input {...register('name')} placeholder={lbl.namePh} className={fieldInput} />
        </div>
        <div>
          <label className={fieldLabel}>{lbl.email}</label>
          <input {...register('email')} type="email" placeholder={lbl.emailPh} className={fieldInput} />
        </div>
      </div>

      <div>
        <label className={fieldLabel}>{lbl.subject}</label>
        <div className="relative">
          <select {...register('subject')} className={`${fieldInput} appearance-none pr-8 cursor-pointer`}>
            {subs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[var(--cta)]">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      <div>
        <label className={fieldLabel}>{lbl.message}</label>
        <textarea {...register('message')} rows={3} placeholder={lbl.messagePh} className={`${fieldInput} resize-none leading-relaxed`} />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-[var(--cta)] text-white text-[0.7rem] font-bold tracking-[0.2em] uppercase px-9 h-12 hover:bg-[var(--cta-hover)] transition-colors disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? lbl.sending : lbl.send}
        </button>
      </div>
    </form>
  );
}
