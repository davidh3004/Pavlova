import { useStore } from '@nanostores/react';
import { langStore, setLang, type Lang } from '@/stores/language';

interface Props {
  lang: Lang;
}

export default function LanguageSwitcher({ lang: serverLang }: Props) {
  const clientLang = useStore(langStore);
  // Use client store if hydrated, otherwise use server prop
  const current = typeof window !== 'undefined' ? clientLang : serverLang;

  const toggle = () => {
    const next: Lang = current === 'en' ? 'es' : 'en';
    setLang(next);
    // Reload to re-render server-side translations
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-semibold tracking-widest hover:bg-base-200 transition-colors"
      title={current === 'en' ? 'Cambiar a Español' : 'Switch to English'}
      aria-label={current === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <span className={current === 'en' ? 'text-primary' : 'text-base-content/35'}>EN</span>
      <span className="text-base-content/20">·</span>
      <span className={current === 'es' ? 'text-primary' : 'text-base-content/35'}>ES</span>
    </button>
  );
}
