'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '@/lib/theme-provider';
import { SunIcon, MoonIcon, MonitorIcon, ChevronDownIcon, CheckIcon } from '@/components/icons';

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

  const options: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <SunIcon className="w-3.5 h-3.5" /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-3.5 h-3.5" /> },
    { value: 'system', label: `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`, icon: <MonitorIcon className="w-3.5 h-3.5" /> },
  ];

  const currentIcon =
    theme === 'system' ? (
      <MonitorIcon className="w-3.5 h-3.5" />
    ) : resolvedTheme === 'dark' ? (
      <MoonIcon className="w-3.5 h-3.5" />
    ) : (
      <SunIcon className="w-3.5 h-3.5" />
    );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Select color theme. Current theme: ${theme} (${resolvedTheme})`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex h-9 items-center gap-2 rounded-xl border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-text-primary shadow-2xs transition hover:bg-surface-elevated hover:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <span aria-hidden="true" className="text-brand flex items-center justify-center">
          {currentIcon}
        </span>
        <span className="capitalize hidden sm:inline">{theme}</span>
        <ChevronDownIcon
          className={`w-3 h-3 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-xl shadow-black/15 backdrop-blur-xl z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
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
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-selected text-brand font-bold'
                    : 'text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={isSelected ? 'text-brand' : 'text-text-secondary'}>{opt.icon}</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && <CheckIcon className="w-3.5 h-3.5 text-brand" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
