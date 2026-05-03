import { useState, useEffect } from 'react';

/**
 * Hook to manage the application theme (Light/Dark).
 * Defaults to 'dark' as per user request.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage, then default to 'dark'
    const saved = localStorage.getItem('nhr-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    
    localStorage.setItem('nhr-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
};
