import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/index.js';

export const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2.5 rounded-xl transition-all duration-300 active:scale-90",
        "bg-surface-bg border border-border-main text-content-muted hover:text-primary hover:border-primary/30 shadow-soft",
        className
      )}
      aria-label={isDark ? "تفعيل الوضع المضيء" : "تفعيل الوضع الليلي"}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <svg
          className={cn(
            "absolute inset-0 w-5 h-5 transform transition-all duration-500",
            isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
        >
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>

        {/* Moon Icon */}
        <svg
          className={cn(
            "absolute inset-0 w-5 h-5 transform transition-all duration-500",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
        >
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </div>
    </button>
  );
};
