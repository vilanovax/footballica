"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { useLanguageStore } from "@/stores/languageStore";
import { getDirection, type Locale } from "./config";
import { getEnglishDictionary, peekDictionary } from "./dictionaries";
import { useSeedLocale } from "@/components/i18n/LanguageProvider";

type Params = Record<string, string | number>;

function resolve(dict: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Cookie seed matches SSR dir/lang. Persist locale after Zustand hydrates.
 * Persian dictionary is eager so `t()` is never English on an RTL page.
 */
export function useTranslation() {
  const seedLocale = useSeedLocale();
  const storeLocale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const [persistReady, setPersistReady] = useState(false);

  useLayoutEffect(() => {
    const mark = () => setPersistReady(true);
    const unsub = useLanguageStore.persist.onFinishHydration(mark);
    if (useLanguageStore.persist.hasHydrated()) mark();
    return unsub;
  }, []);

  const locale = (persistReady ? storeLocale : seedLocale) as Locale;

  const t = useCallback(
    (key: string, params?: Params): string => {
      const en = getEnglishDictionary();
      const activeDict = peekDictionary(locale) ?? en;
      const active = resolve(activeDict, key);
      const value =
        typeof active === "string" ? active : resolve(en, key);
      if (typeof value !== "string") return key;
      return interpolate(value, params);
    },
    [locale],
  );

  return { t, locale, dir: getDirection(locale), setLocale };
}
