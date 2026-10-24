'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onVoiceClick?: () => void;
}

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi-NCR', 'Hyderabad', 'Chennai', 'Kolkata'];

export function Header({
  searchQuery = '',
  onSearchChange,
  selectedCity = 'Bengaluru',
  onCityChange,
  onVoiceClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo & Voice-First Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/20 transition-transform group-hover:scale-105">
                {/* Audio wave / cinema reel icon */}
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-text-primary">
                  Cine<span className="text-brand">Suno</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-text-secondary uppercase">
                  Voice-First Cinema
                </span>
              </div>
            </Link>

            <div className="hidden rounded-full border border-border-subtle bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold text-brand sm:inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Bolna Voice Powered
            </div>
          </div>

          {/* Right Header Controls: City Selector, Theme Toggle, Voice Action */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* City Selector */}
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                aria-label="Select City"
                value={selectedCity}
                onChange={(e) => onCityChange?.(e.target.value)}
                className="rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-medium text-text-primary outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city} className="bg-surface text-text-primary">
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Voice Booking Button */}
            <button
              type="button"
              onClick={onVoiceClick}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-focus active:scale-95"
            >
              <svg className="h-3.5 w-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Speak to Book</span>
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search movies by title, genre, or language (e.g. Kalki, Action, Telugu)..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface-elevated py-2 pl-10 pr-10 text-xs sm:text-sm text-text-primary placeholder:text-text-secondary outline-none transition focus:border-brand focus:bg-surface focus:ring-1 focus:ring-brand"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-secondary hover:text-text-primary"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
