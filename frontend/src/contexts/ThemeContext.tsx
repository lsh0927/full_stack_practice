'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // 시스템 테마 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setEffectiveTheme(newTheme);
        updateDocumentTheme(newTheme);
      }
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // localStorage에서 테마 로드
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  // 테마 변경 시 적용
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const newTheme = isDark ? 'dark' : 'light';
      setEffectiveTheme(newTheme);
      updateDocumentTheme(newTheme);
    } else {
      setEffectiveTheme(theme);
      updateDocumentTheme(theme);
    }
  }, [theme]);

  const updateDocumentTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    console.log('Updating document theme to:', newTheme);
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      console.log('Dark mode applied. Classes:', root.classList.toString());
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      console.log('Light mode applied. Classes:', root.classList.toString());
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
