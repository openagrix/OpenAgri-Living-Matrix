"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries } from "./dictionaries";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Dictionary,
  type Locale,
} from "./types";

type NestedValue = string | readonly string[] | { readonly [key: string]: NestedValue };

function getByPath(obj: NestedValue, path: string): string | undefined {
  const parts = path.split(".");
  let cur: NestedValue | undefined = obj;
  for (const p of parts) {
    if (cur == null || typeof cur === "string" || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, NestedValue>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (stored === "vi" || stored === "en") setLocaleState(stored);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const dict = dictionaries[locale] as Dictionary;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw =
        getByPath(dictionaries[locale] as NestedValue, key) ??
        getByPath(dictionaries.vi as NestedValue, key) ??
        key;
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        raw
      );
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, dict }),
    [locale, setLocale, t, dict]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return ctx;
}
