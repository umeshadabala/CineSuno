'use client';

import React from 'react';
import Image from 'next/image';
import { Movie } from '@/types';
import { RecommendedMovie, UserPreferences } from '@/lib/preferences';
import { SettingsIcon, StarIcon, ChevronRightIcon, SparklesIcon } from '@/components/icons';

interface RecommendedSectionProps {
  recommendations: RecommendedMovie[];
  preferences: UserPreferences;
  onOpenPreferences: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export function RecommendedSection({
  recommendations,
  preferences,
  onOpenPreferences,
  onSelectMovie,
}: RecommendedSectionProps) {
  if (recommendations.length === 0) return null;

  // Take top 3 recommendations
  const topRecs = recommendations.slice(0, 3);

  return (
    <section aria-label="Curated recommendations" className="my-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-text-primary tracking-tight">
              Curated for You
            </span>
            <span className="rounded-full bg-selected border border-brand/30 px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1">
              <SparklesIcon className="w-3 h-3 text-brand" />
              <span>Preference Match</span>
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Ranked for your taste in {preferences.languages.join(', ')} • {preferences.genres.join(', ')}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPreferences}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:border-brand hover:bg-selected hover:text-brand transition shadow-2xs"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Edit Preferences</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {topRecs.map(({ movie, explanation }) => (
          <div
            key={`rec-${movie.id}`}
            onClick={() => onSelectMovie(movie)}
            className="group relative flex cursor-pointer gap-3.5 rounded-2xl border border-border-subtle bg-surface p-3.5 shadow-xs transition hover:border-brand/50 hover:shadow-md"
          >
            {/* Real Poster thumbnail */}
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
              <Image
                src={movie.poster}
                alt={`${movie.title} poster`}
                fill
                unoptimized
                sizes="80px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>

            {/* Info & Reason */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-sm font-bold text-text-primary truncate group-hover:text-brand transition">
                    {movie.title}
                  </h3>
                  {movie.rating && (
                    <span className="shrink-0 text-xs font-bold text-brand flex items-center gap-0.5">
                      <StarIcon className="w-3 h-3 text-brand" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-text-secondary">
                  <span>{movie.languages.slice(0, 2).join(', ')}</span>
                  <span>•</span>
                  <span>{movie.genres.join(', ')}</span>
                </div>

                <p className="mt-2 text-[11px] leading-snug text-text-secondary line-clamp-2">
                  {explanation}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2">
                <span className="text-[11px] font-bold text-brand flex items-center gap-1 group-hover:underline">
                  <span>Book Tickets</span>
                  <ChevronRightIcon className="w-3 h-3" />
                </span>
                <span className="text-[10px] text-text-secondary font-medium">
                  {movie.runtimeMinutes}m
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
