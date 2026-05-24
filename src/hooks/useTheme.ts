import { useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'hola_theme';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-light', theme === 'light');
    root.classList.toggle('theme-dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
};
