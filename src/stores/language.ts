import { atom } from 'nanostores';

export type Lang = 'en' | 'es';

function getInitialLang(): Lang {
  if (typeof document === 'undefined') return 'en';
  const cookie = document.cookie.match(/pavlova_lang=([^;]+)/);
  if (cookie && (cookie[1] === 'en' || cookie[1] === 'es')) return cookie[1] as Lang;
  const stored = localStorage.getItem('pavlova_lang');
  if (stored === 'en' || stored === 'es') return stored as Lang;
  return 'en';
}

export const langStore = atom<Lang>(
  typeof document !== 'undefined' ? getInitialLang() : 'en'
);

export function setLang(lang: Lang) {
  langStore.set(lang);
  if (typeof document !== 'undefined') {
    localStorage.setItem('pavlova_lang', lang);
    document.cookie = `pavlova_lang=${lang};path=/;max-age=31536000`;
    // Update html lang attribute
    document.documentElement.lang = lang;
  }
}

export function getLang(): Lang {
  return langStore.get();
}
