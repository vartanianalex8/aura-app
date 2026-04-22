import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../constants/theme';
import { LOGO_OPTIONS, BG_OPTIONS } from '../constants/config';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('aura-theme') || 'dark');
  const [logoStyle, setLogoStyle] = useState(() => localStorage.getItem('aura-logo') || 'default');
  const [bgStyle, setBgStyle] = useState(() => localStorage.getItem('aura-bg') || 'default');

  useEffect(() => {
    const resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;

    const vars = THEMES[resolved];
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('aura-theme', mode);
  }, [mode]);

  useEffect(() => {
    const logo = LOGO_OPTIONS.find((l) => l.value === logoStyle);
    if (logo) {
      document.documentElement.style.setProperty('--accent', logo.colors[0]);
      document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${logo.colors[0]}, ${logo.colors[1]})`);
    }
    localStorage.setItem('aura-logo', logoStyle);
  }, [logoStyle]);

  useEffect(() => {
    const bg = BG_OPTIONS.find((b) => b.value === bgStyle);
    document.documentElement.style.setProperty('--bg-overlay', bg?.bg || 'none');
    localStorage.setItem('aura-bg', bgStyle);
  }, [bgStyle]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, logoStyle, setLogoStyle, bgStyle, setBgStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
