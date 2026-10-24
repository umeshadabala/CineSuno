'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { MapPinIcon, MicIcon, FilmIcon, SettingsIcon } from '@/components/icons';

interface HeaderProps {
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onVoiceClick?: () => void;
  onPreferencesClick?: () => void;
}

const CITIES = [
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Mumbai', label: 'Mumbai' },
  { value: 'Delhi-NCR', label: 'Delhi-NCR' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Kolkata', label: 'Kolkata' },
];

export function Header({
  selectedCity = 'Bengaluru',
  onCityChange,
  onVoiceClick,
  onPreferencesClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-brand rounded-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/20 transition-transform group-hover:scale-105">
              <FilmIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-text-primary leading-tight">
                Cine<span className="text-brand">Suno</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-text-secondary uppercase">
                Cinema Ticketing
              </span>
            </div>
          </Link>

          {/* Nav Destination */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            <a
              href="#movies-section"
              className="text-text-secondary hover:text-brand transition flex items-center gap-1.5"
            >
              <span>Movies</span>
            </a>
            <Link
              href="/booking"
              className="text-text-secondary hover:text-brand transition flex items-center gap-1.5"
            >
              <span>My Bookings</span>
            </Link>
            {onPreferencesClick && (
              <button
                type="button"
                onClick={onPreferencesClick}
                className="text-text-secondary hover:text-brand transition flex items-center gap-1.5 cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Header Controls: City Selector, Theme Toggle, Voice Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Custom Styled City Selector */}
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 text-brand shrink-0 hidden sm:inline" />
            <CustomSelect
              value={selectedCity}
              options={CITIES}
              onChange={(city) => onCityChange?.(city)}
              ariaLabel="Select City"
              triggerClassName="h-9 px-2.5 py-1 text-xs"
            />
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Voice Search Entry Button */}
          {onVoiceClick && (
            <button
              type="button"
              onClick={onVoiceClick}
              aria-label="Start voice search"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand active:scale-95"
            >
              <MicIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice Search</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
