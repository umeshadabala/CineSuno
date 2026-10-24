'use client';

import React from 'react';
import { MovieStatus } from '@/types';

interface MovieFilterBarProps {
  statusFilter: MovieStatus | 'all';
  onStatusChange: (status: MovieStatus | 'all') => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  totalResults: number;
  onResetFilters: () => void;
}

const LANGUAGES = ['All', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'];
const GENRES = ['All', 'Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama', 'Adventure'];

export function MovieFilterBar({
  statusFilter,
  onStatusChange,
  selectedLanguage,
  onLanguageChange,
  selectedGenre,
  onGenreChange,
  totalResults,
  onResetFilters,
}: MovieFilterBarProps) {
  const isFiltered =
    statusFilter !== 'all' || selectedLanguage !== 'All' || selectedGenre !== 'All';

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* Top Row: Status Tabs & Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-xl bg-surface-elevated p-1 border border-border-subtle">
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            All Movies
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('now_showing')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'now_showing'
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Now Showing
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('coming_soon')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'coming_soon'
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Coming Soon
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span>
            Showing <strong className="text-text-primary font-bold">{totalResults}</strong> movies
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-brand hover:underline underline-offset-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Language Pills Carousel / Wrap */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] shrink-0">
          Language:
        </span>
        {LANGUAGES.map((lang) => {
          const active = selectedLanguage === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium transition ${
                active
                  ? 'border border-brand bg-selected text-brand font-bold shadow-xs'
                  : 'border border-border-subtle bg-surface text-text-secondary hover:border-brand hover:text-text-primary'
              }`}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {/* Genre Pills Carousel / Wrap */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="font-bold text-text-secondary uppercase tracking-wider text-[10px] shrink-0">
          Genre:
        </span>
        {GENRES.map((genre) => {
          const active = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onGenreChange(genre)}
              className={`shrink-0 rounded-full px-3 py-1 font-medium transition ${
                active
                  ? 'border border-brand bg-selected text-brand font-bold shadow-xs'
                  : 'border border-border-subtle bg-surface text-text-secondary hover:border-brand hover:text-text-primary'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
