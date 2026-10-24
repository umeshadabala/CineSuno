'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '@/lib/theme-provider';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: Array<{ value: Theme; label: string; icon: string }> = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`, icon: '💻' },
  ];

  const currentIcon = theme === 'system' ? '💻' : resolvedTheme === 'dark' ? '🌙' : '☀️';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Select color theme. Current theme: ${theme} (${resolvedTheme})`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-primary shadow-sm transition hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <span aria-hidden="true" className="text-sm">{currentIcon}</span>
        <span className="capitalize hidden sm:inline">{theme}</span>
        <svg
          className={`h-3.5 w-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitem"
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-selected text-brand font-bold'
                    : 'text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{opt.icon}</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <svg className="h-3.5 w-3.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
