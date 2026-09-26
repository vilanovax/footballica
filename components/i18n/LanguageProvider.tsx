"use client";

import { createContext, useContext, useLayoutEffect } from "react";
import { useLanguageStore } from "@/stores/languageStore";
import { DEFAULT_LOCALE, getDirection, type Locale } from "@/lib/i18n/config";

const SeedLocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function useSeedLocale(): Locale {
  return useContext(SeedLocaleContext);
}

function applyDocLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = getDirection(locale);
}

/**
 * Cookie locale from the server seeds first paint. Persist wins after hydrate
 * so we never flash English on a Persian document.
 */
export function LanguageProvider({
  children,
  seedLocale,
}: {
  children: React.ReactNode;
  seedLocale: Locale;
}) {
  const locale = useLanguageStore((s) => s.locale);

  useLayoutEffect(() => {
    const unsub = useLanguageStore.persist.onFinishHydration(() => {
      applyDocLocale(useLanguageStore.getState().locale);
    });
    if (useLanguageStore.persist.hasHydrated()) applyDocLocale(locale);
    return unsub;
  }, [locale]);

  return (
    <SeedLocaleContext.Provider value={seedLocale}>
      {children}
    </SeedLocaleContext.Provider>
  );
}
