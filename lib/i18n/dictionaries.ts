import en from "./locales/en";
import fa from "./locales/fa";
import type { Dictionary } from "./locales/en";
import type { Locale } from "./config";

/**
 * Both locales ship in the client graph. Persian is first-class — lazy
 * loading caused an English flash on RTL first paint.
 */
const cache: Record<Locale, Dictionary> = { en, fa };

export function peekDictionary(locale: Locale): Dictionary | undefined {
  return cache[locale];
}

export function getEnglishDictionary(): Dictionary {
  return en;
}

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  return cache[locale] ?? en;
}
