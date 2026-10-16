import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '@/utils/storageUtils';
import { THEMES, applyTheme } from '@/config/themes';

const ThemeContext = createContext(null);

const THEME_KEY = 'theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = getItem(THEME_KEY) || 'light';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const changeTheme = useCallback((themeId) => {
    if (!THEMES[themeId]) return;
    setTheme(themeId);
    setItem(THEME_KEY, themeId);
    applyTheme(themeId);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
