'use client';

import React from 'react';
import Image from 'next/image';
import { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  const hours = Math.floor(movie.runtimeMinutes / 60);
  const minutes = movie.runtimeMinutes % 60;
  const formattedRuntime = `${hours}h ${minutes}m`;

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
      aria-label={`View details for ${movie.title}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-rose-950/20 focus:outline-none focus:ring-2 focus:ring-rose-500"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <Image
          src={movie.poster}
          alt={`Official poster for ${movie.title}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={movie.id === 'mov-01'}
        />

        {/* Gradient Overlay for bottom text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md border border-zinc-700/80 bg-zinc-900/90 px-2 py-0.5 text-[11px] font-bold text-zinc-200 backdrop-blur-md">
            {movie.certificate}
          </span>
          {movie.status === 'coming_soon' && (
            <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-extrabold text-black uppercase tracking-wider backdrop-blur-md">
              Soon
            </span>
          )}
        </div>

        {movie.rating && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-zinc-950/80 px-2 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-md border border-amber-500/30">
            <span>★</span>
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Bottom Poster Info Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300">
          <span className="font-medium text-zinc-400">{formattedRuntime}</span>
          <span className="truncate text-[11px] font-semibold text-rose-400">
            {movie.languages.slice(0, 2).join(', ')}
            {movie.languages.length > 2 ? ` +${movie.languages.length - 2}` : ''}
          </span>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-bold text-white transition-colors group-hover:text-rose-400">
            {movie.title}
          </h3>

          {/* Genre Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {movie.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300"
              >
                {genre}
              </span>
            ))}
          </div>

          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {movie.synopsis}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-zinc-400">
            {movie.status === 'now_showing' ? 'Tickets Available' : 'Releasing Soon'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(movie);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-500 active:scale-95"
          >
            <span>{movie.status === 'now_showing' ? 'Book' : 'Notify'}</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
