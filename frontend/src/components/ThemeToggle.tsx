'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from '@/components/ui';

/**
 * Theme Toggle Component
 * 다크모드/라이트모드를 전환하는 토글 버튼
 */
export default function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const handleToggle = () => {
    console.log('Toggle clicked! Current:', { theme, effectiveTheme });
    if (theme === 'system') {
      // 시스템 모드일 때는 현재 effective theme의 반대로 설정
      const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
      console.log('Setting theme to:', newTheme);
      setTheme(newTheme);
    } else {
      // 수동 모드일 때는 토글
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      console.log('Setting theme to:', newTheme);
      setTheme(newTheme);
    }
  };

  const handleSystemTheme = () => {
    console.log('System theme clicked');
    setTheme('system');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Theme Toggle Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Toggle theme"
        title={`Current: ${effectiveTheme} mode${theme === 'system' ? ' (system)' : ''}`}
      >
        {effectiveTheme === 'dark' ? (
          <Icon name="moon" size={20} className="text-gray-700 dark:text-gray-300" />
        ) : (
          <Icon name="sun" size={20} className="text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* System Theme Button (Optional) */}
      {theme !== 'system' && (
        <button
          onClick={handleSystemTheme}
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Use system theme"
          title="Use system theme"
        >
          <Icon name="monitor" size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}
