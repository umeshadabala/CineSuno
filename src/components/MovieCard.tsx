'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Movie } from '@/types';
import { StarIcon, ChevronRightIcon, ClockIcon } from '@/components/icons';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);

  const hours = Math.floor(movie.runtimeMinutes / 60);
  const minutes = movie.runtimeMinutes % 60;
  const formattedRuntime = `${hours}h ${minutes}m`;

  // Real promotional poster image source
  const posterSrc = imageError
    ? '/posters/kalki.jpg'
    : movie.poster.replace(/\.svg$/i, '.jpg');

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(movie);
        }
      }}
      aria-label={`View details and showtimes for ${movie.title}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-elevated">
        <Image
          src={posterSrc}
          alt={`${movie.title} official poster`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={movie.id === 'mov-01'}
          onError={() => setImageError(true)}
        />

        {/* Gradient Overlay for bottom text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
            {movie.certificate}
          </span>
          {movie.status === 'coming_soon' && (
            <span className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white uppercase tracking-wider backdrop-blur-md shadow-xs">
              Coming Soon
            </span>
          )}
        </div>

        {movie.rating && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-md border border-white/20">
            <StarIcon className="w-3.5 h-3.5 text-brand" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom Poster Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="font-medium text-white/90 flex items-center gap-1">
            <ClockIcon className="w-3 h-3 text-white/80" />
            <span>{formattedRuntime}</span>
          </span>
          <span className="truncate text-[11px] font-semibold text-white/95">
            {movie.languages.slice(0, 2).join(', ')}
            {movie.languages.length > 2 ? ` +${movie.languages.length - 2}` : ''}
          </span>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-bold text-text-primary transition-colors group-hover:text-brand">
            {movie.title}
          </h3>

          {/* Genre Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {movie.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold text-text-secondary"
              >
                {genre}
              </span>
            ))}
          </div>

          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {movie.synopsis}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-text-secondary">
            {movie.status === 'now_showing' ? 'Tickets Available' : 'In Cinemas Soon'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(movie);
            }}
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-hover active:scale-95 shadow-xs"
          >
            <span>{movie.status === 'now_showing' ? 'Book' : 'Details'}</span>
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
