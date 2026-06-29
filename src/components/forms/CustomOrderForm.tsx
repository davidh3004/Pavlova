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

  if (success) {
    return (
      <div className="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{lbl.success}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <div className="alert alert-error text-sm"><span>{serverError}</span></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">{lbl.name}</span></label>
          <input {...register('name')} className={`input input-bordered ${errors.name ? 'input-error' : ''}`} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">{lbl.phone}</span></label>
          <input {...register('phone')} type="tel" className={`input input-bordered ${errors.phone ? 'input-error' : ''}`} />
        </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">{lbl.email}</span></label>
        <input {...register('email')} type="email" className={`input input-bordered ${errors.email ? 'input-error' : ''}`} />
        {errors.email && <label className="label"><span className="label-text-alt text-error">Invalid email</span></label>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">{lbl.type}</span></label>
          <select {...register('dessertType')} className={`select select-bordered ${errors.dessertType ? 'select-error' : ''}`}>
            <option value="">{lbl.selectType}</option>
            {lbl.types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">{lbl.size}</span></label>
          <input {...register('size')} className={`input input-bordered ${errors.size ? 'input-error' : ''}`} placeholder={lang === 'es' ? 'ej. 8 porciones' : 'e.g. 8 servings'} />
        </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">{lbl.flavors}</span></label>
        <textarea {...register('flavors')} rows={3} className={`textarea textarea-bordered ${errors.flavors ? 'textarea-error' : ''}`} placeholder={lang === 'es' ? 'ej. Frutos del bosque, crema chantilly, sin gluten...' : 'e.g. Mixed berries, chantilly cream, gluten-free...'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">{lbl.occasion}</span></label>
          <input {...register('occasion')} className="input input-bordered" placeholder={lang === 'es' ? 'Cumpleaños, boda...' : 'Birthday, wedding...'} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text font-medium">{lbl.neededBy}</span></label>
          <input {...register('neededBy')} type="date" className={`input input-bordered ${errors.neededBy ? 'input-error' : ''}`} />
        </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">{lbl.imageUrl}</span></label>
        <input {...register('imageUrl')} type="url" className="input input-bordered" placeholder="https://..." />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">{lbl.notes}</span></label>
        <textarea {...register('notes')} rows={3} className="textarea textarea-bordered" />
      </div>

      <button type="submit" className="btn btn-cta w-full" disabled={isSubmitting}>
        {isSubmitting ? lbl.sending : lbl.submit}
      </button>
    </form>
  );
}
