"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

const STORAGE_KEY = "sightsignal-theme";
const THEME_CYCLE: Theme[] = ["system", "light", "dark"];

const getSystemTheme = (): EffectiveTheme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

const resolveEffectiveTheme = (theme: Theme): EffectiveTheme => {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => {
    const stored = getStoredTheme();
    return resolveEffectiveTheme(stored);
  });

  // Set initial theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const effective = getSystemTheme();
        setEffectiveTheme(effective);
        document.documentElement.setAttribute("data-theme", effective);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const effective = resolveEffectiveTheme(newTheme);
    setEffectiveTheme(effective);
    document.documentElement.setAttribute("data-theme", effective);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    const nextTheme = THEME_CYCLE[nextIndex];
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, effectiveTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
