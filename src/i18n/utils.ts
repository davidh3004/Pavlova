import en from './locales/en.json';
import es from './locales/es.json';

export type Lang = 'en' | 'es';
export type Translations = typeof en;

const locales: Record<Lang, Translations> = { en, es };

/**
 * Server-side translation helper for Astro components.
 * Usage: const { t } = useTranslations(lang);
 *        t('nav.dailyMenu')
 */
export function useTranslations(lang: Lang) {
  return {
    t(key: string): string {
      const keys = key.split('.');
      let result: unknown = locales[lang];
      for (const k of keys) {
        if (result && typeof result === 'object' && k in (result as object)) {
          result = (result as Record<string, unknown>)[k];
        } else {
          // Fallback to English
          let fallback: unknown = locales.en;
          for (const fk of keys) {
            if (fallback && typeof fallback === 'object' && fk in (fallback as object)) {
              fallback = (fallback as Record<string, unknown>)[fk];
            } else {
              return key;
            }
          }
          return typeof fallback === 'string' ? fallback : key;
        }
      }
      return typeof result === 'string' ? result : key;
    },
    lang,
    locale: locales[lang],
  };
}

/**
 * Detect language from cookie header string.
 */
export function detectLang(cookieHeader: string | null): Lang {
  if (!cookieHeader) return 'en';
  const match = cookieHeader.match(/pavlova_lang=([^;]+)/);
  if (match && (match[1] === 'en' || match[1] === 'es')) return match[1] as Lang;
  return 'en';
}
