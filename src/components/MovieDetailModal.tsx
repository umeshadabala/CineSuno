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
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-2xl transition-colors">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-20 rounded-full bg-surface-elevated/90 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition shadow-sm"
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
                className="rounded-xl border border-border-subtle bg-surface-elevated p-2 text-text-secondary hover:text-text-primary transition"
                aria-label="Back to movie details"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  Showtime Selection
                </span>
                <h2 id="movie-modal-title" className="text-2xl font-black text-text-primary">
                  {movie.title}
                </h2>
                <p className="text-xs text-text-secondary">
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
            <div className="relative aspect-[2/3] w-full sm:w-2/5 shrink-0 bg-surface-elevated">
              <Image
                src={posterSrc}
                alt={movie.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />
            </div>

            {/* Details Section */}
            <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-border-subtle bg-surface-elevated px-2.5 py-0.5 text-xs font-bold text-text-primary">
                    {movie.certificate}
                  </span>
                  {movie.rating && (
                    <span className="flex items-center gap-1 rounded-md border border-border-subtle bg-surface-elevated px-2 py-0.5 text-xs font-extrabold text-brand">
                      ★ {movie.rating.toFixed(1)} / 10
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">{formattedRuntime}</span>
                </div>

                <h2 id="movie-modal-title" className="mt-2 text-2xl font-black text-text-primary">
                  {movie.title}
                </h2>

                {/* Genre Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Languages */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-text-secondary">Languages:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {movie.languages.map((lang) => (
                      <span
                        key={lang}
                        className="rounded-md border border-border-subtle bg-selected px-2 py-0.5 text-xs font-semibold text-brand"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Synopsis */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-text-secondary">Synopsis:</span>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {movie.synopsis}
                  </p>
                </div>

                {movie.releaseDate && (
                  <div className="mt-4 text-xs text-text-secondary">
                    Release Date: <span className="text-text-primary font-medium">{movie.releaseDate}</span>
                  </div>
                )}
              </div>

              {/* Actions & Voice Prompts */}
              <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
                {/* Voice suggestion banner */}
                <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-text-secondary">
                  <span className="text-base text-brand">🎙️</span>
                  <span>
                    Say: <em className="text-text-primary font-semibold">“Book tickets for {movie.title} tonight”</em>
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
                    className="flex-1 rounded-xl bg-brand py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover active:scale-95"
                  >
                    {movie.status === 'now_showing' ? 'Select Showtimes →' : 'Notify on Release'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm font-semibold text-text-primary hover:bg-surface-elevated transition"
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
