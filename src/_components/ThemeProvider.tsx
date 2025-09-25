/** CUSTOM THEME PROVIDER - shadcn/ui's is too barebones and incomplete.
 * - Transition disabling during theme changes
 * - Cross-tab synchronization via storage events
 * - Real-time system theme change detection
 * - Robust localStorage error handling with fallbacks
 * - Uses React 19's use() hook as useContext is now deprecated
 * - Proper colorScheme CSS property setting for browser integration
 * - Theme validation to prevent invalid states
 */
import { createContext, use, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextTypes {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextTypes | null>(null);

const STORAGE_KEY = "theme";
export const THEMES = ["light", "dark", "system"] as const;

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({ children, defaultTheme = "system", storageKey = STORAGE_KEY }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored && isValidTheme(stored) ? stored : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const setTheme = (newTheme: Theme) => {
    const enableTransitions = disableTransitions();
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.error("ERROR: Failed to save theme preference:", error);
    }
    requestAnimationFrame(enableTransitions);
  };

  // Apply theme to DOM whenever theme state changes
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = theme === "system" ? getSystemTheme() : theme;
    root.classList.remove("light", "dark");
    root.classList.add(currentTheme);
    root.style.colorScheme = currentTheme;
  }, [theme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = document.documentElement;
      const systemTheme = getSystemTheme();
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
      root.style.colorScheme = systemTheme;
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Cross-tab synchronization via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue && isValidTheme(e.newValue)) {
        const enableTransitions = disableTransitions();
        setThemeState(e.newValue);
        requestAnimationFrame(enableTransitions);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [storageKey]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("ERROR: useTheme must be used within ThemeProvider.");
  }
  return context;
}

function isValidTheme(value: string): value is Theme {
  return THEMES.includes(value as Theme);
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function disableTransitions() {
  const root = document.documentElement;
  root.dataset.disableTransitions = "";
  // Force a reflow
  // Regarding getComputedStyle vs requestAnimationFrame: https://paco.me/writing/disable-theme-transitions
  void window.getComputedStyle(root).opacity;
  return () => {
    delete root.dataset.disableTransitions;
  };
}
