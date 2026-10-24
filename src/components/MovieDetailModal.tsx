'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Movie, Show } from '@/types';
import { ShowtimePicker } from './ShowtimePicker';

interface MovieDetailModalProps {
  movie: Movie | null;
  selectedCity?: string;
  onClose: () => void;
  onSelectShowtime?: (movie: Movie, show: Show) => void;
}

export function MovieDetailModal({
  movie,
  selectedCity = 'Bengaluru',
  onClose,
  onSelectShowtime,
}: MovieDetailModalProps) {
  const [viewMode, setViewMode] = useState<'details' | 'showtimes'>('details');

  const handleClose = React.useCallback(() => {
    setViewMode('details');
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (movie) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movie, handleClose]);

  if (!movie) return null;

  const hours = Math.floor(movie.runtimeMinutes / 60);
  const minutes = movie.runtimeMinutes % 60;
  const formattedRuntime = `${hours} hr ${minutes} min`;
  const posterSrc = movie.poster.replace(/\.jpe?g$/i, '.svg');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-rose-950/40">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-20 rounded-full bg-zinc-900/80 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {viewMode === 'showtimes' ? (
          /* Showtime Picker View */
          <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setViewMode('details')}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                aria-label="Back to movie details"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Showtime Selection
                </span>
                <h2 id="movie-modal-title" className="text-2xl font-black text-white">
                  {movie.title}
                </h2>
                <p className="text-xs text-zinc-400">
                  {selectedCity} • {movie.certificate} • {formattedRuntime}
                </p>
              </div>
            </div>

            <ShowtimePicker
              movie={movie}
              selectedCity={selectedCity}
              onSelectShow={(show) => {
                if (onSelectShowtime) {
                  onSelectShowtime(movie, show);
                }
              }}
            />
          </div>
        ) : (
          /* Movie Details View */
          <div className="flex flex-col sm:flex-row max-h-[85vh] overflow-y-auto">
            {/* Poster Section */}
            <div className="relative aspect-[2/3] w-full sm:w-2/5 shrink-0 bg-zinc-900">
              <Image
                src={posterSrc}
                alt={movie.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent sm:hidden" />
            </div>

            {/* Details Section */}
            <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-xs font-bold text-zinc-200">
                    {movie.certificate}
                  </span>
                  {movie.rating && (
                    <span className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-extrabold text-amber-400">
                      ★ {movie.rating.toFixed(1)} / 10
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">{formattedRuntime}</span>
                </div>

                <h2 id="movie-modal-title" className="mt-2 text-2xl font-black text-white">
                  {movie.title}
                </h2>

                {/* Genre Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Languages */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-zinc-400">Languages:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {movie.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-rose-400"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Synopsis */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-zinc-400">Synopsis:</span>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                    {movie.synopsis}
                  </p>
                </div>

                {movie.releaseDate && (
                  <div className="mt-4 text-xs text-zinc-500">
                    Release Date: <span className="text-zinc-300 font-medium">{movie.releaseDate}</span>
                  </div>
                )}
              </div>

              {/* Actions & Voice Prompts */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col gap-3">
                {/* Voice suggestion banner */}
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
                  <span className="text-base">🎙️</span>
                  <span>
                    Say: <em className="text-white">“Book tickets for {movie.title} tonight”</em>
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (movie.status === 'now_showing') {
                        setViewMode('showtimes');
                      }
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3 text-center text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition hover:brightness-110 active:scale-95"
                  >
                    {movie.status === 'now_showing' ? 'Select Showtimes →' : 'Notify on Release'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
