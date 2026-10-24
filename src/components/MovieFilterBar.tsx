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
        <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Movies
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('now_showing')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'now_showing'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Now Showing
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('coming_soon')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === 'coming_soon'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Coming Soon
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>
            Showing <strong className="text-zinc-100">{totalResults}</strong> movies
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Language Pills Carousel / Wrap */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] shrink-0">
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
                  ? 'border border-amber-500/50 bg-amber-500/20 text-amber-300 font-bold'
                  : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {/* Genre Pills Carousel / Wrap */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] shrink-0">
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
                  ? 'border border-rose-500/50 bg-rose-500/20 text-rose-300 font-bold'
                  : 'border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
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
