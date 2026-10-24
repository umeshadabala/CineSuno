'use client';

import React from 'react';
import { Movie } from '@/types';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectMovie: (movie: Movie) => void;
  onResetFilters?: () => void;
}

export function MovieGrid({
  movies,
  isLoading,
  error,
  onRetry,
  onSelectMovie,
  onResetFilters,
}: MovieGridProps) {
  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 animate-pulse"
          >
            <div className="aspect-[2/3] w-full bg-zinc-800/50" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-zinc-800" />
              <div className="flex gap-2">
                <div className="h-4 w-12 rounded bg-zinc-800/60" />
                <div className="h-4 w-16 rounded bg-zinc-800/60" />
              </div>
              <div className="h-10 w-full rounded bg-zinc-800/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="my-12 flex flex-col items-center justify-center rounded-3xl border border-rose-900/50 bg-rose-950/20 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-900/40 text-rose-400 mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Failed to load movie catalogue</h3>
        <p className="mt-1 max-w-md text-sm text-zinc-400">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition active:scale-95"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty State
  if (movies.length === 0) {
    return (
      <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/40 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 text-3xl mb-4">
          🎬
        </div>
        <h3 className="text-xl font-bold text-white">No movies match your search</h3>
        <p className="mt-1.5 max-w-md text-sm text-zinc-400">
          Try clearing your search query or switching language / genre filters to explore available releases.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-6 rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 transition"
          >
            Reset All Filters
          </button>
        )}
      </div>
    );
  }

  // Movies Grid
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
      ))}
    </div>
  );
}
