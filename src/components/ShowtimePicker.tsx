'use client';

import React, { useState, useEffect } from 'react';
import { Movie, Show } from '@/types';
import { apiClient } from '@/lib/api-client';

interface ShowtimePickerProps {
  movie: Movie;
  selectedCity?: string;
  onSelectShow: (show: Show) => void;
}

export function ShowtimePicker({
  movie,
  selectedCity = 'Bengaluru',
  onSelectShow,
}: ShowtimePickerProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');

  const dates = [
    { label: 'Today', subLabel: '24 Oct', value: '2026-10-24' },
    { label: 'Tomorrow', subLabel: '25 Oct', value: '2026-10-25' },
    { label: 'Mon', subLabel: '26 Oct', value: '2026-10-26' },
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadShows() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.getShows({
          movieId: movie.id,
          date: selectedDate,
          city: selectedCity,
        });

        if (!isMounted) return;

        if (res.success) {
          // If city filter returns empty in mock catalogue, fallback to all shows for this movie and date
          if (res.data.length === 0) {
            const fallbackRes = await apiClient.getShows({
              movieId: movie.id,
              date: selectedDate,
            });
            if (fallbackRes.success && fallbackRes.data.length > 0) {
              setShows(fallbackRes.data);
            } else {
              setShows([]);
            }
          } else {
            setShows(res.data);
          }
        } else {
          setError(res.error.message || 'Failed to fetch showtimes.');
        }
      } catch {
        if (isMounted) setError('Network error while retrieving showtimes.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadShows();
    return () => {
      isMounted = false;
    };
  }, [movie.id, selectedDate, selectedCity]);

  // Format ISO start time to readable 12-hour AM/PM time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Date Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0 mr-2">
          Select Date:
        </span>
        {dates.map((d) => {
          const isSelected = selectedDate === d.value;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => setSelectedDate(d.value)}
              className={`flex flex-col items-center justify-center min-w-[80px] rounded-xl px-4 py-2 transition-all ${
                isSelected
                  ? 'bg-brand text-white shadow-sm font-bold'
                  : 'border border-border-subtle bg-surface text-text-secondary hover:border-brand hover:text-text-primary'
              }`}
            >
              <span className="text-xs uppercase font-medium">{d.label}</span>
              <span className="text-sm font-bold">{d.subLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Shows Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm">Fetching verified showtimes from cinema partner...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 text-center text-text-secondary">
          <p className="font-semibold text-text-primary">{error}</p>
          <button
            type="button"
            onClick={() => setSelectedDate(selectedDate)}
            className="mt-3 rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover shadow-xs"
          >
            Retry
          </button>
        </div>
      ) : shows.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-text-secondary">
          <p className="text-base font-semibold text-text-primary">No showtimes available for this date.</p>
          <p className="mt-1 text-xs text-text-secondary">
            Please select another date above or explore other cinemas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Available showtimes ({shows.length})</span>
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-text-secondary" /> Filling Fast
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shows.map((show) => {
              const priceRupees = Math.round(show.ticketPricePaise / 100);
              const isFillingFast = show.status === 'filling_fast';
              const isSoldOut = show.status === 'sold_out';

              return (
                <button
                  key={show.id}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => onSelectShow(show)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                    isSoldOut
                      ? 'border-border-subtle bg-surface-elevated/40 opacity-40 cursor-not-allowed'
                      : 'border-border-subtle bg-surface hover:border-brand hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
                          {formatTime(show.startTime)}
                        </span>
                        <span className="rounded bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                          {show.format || '2D'}
                        </span>
                        {show.language && (
                          <span className="rounded bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                            {show.language}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{show.screenName || 'Screen 1'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-text-primary">₹{priceRupees}</span>
                      <span className="block text-[10px] text-text-secondary">Base ticket</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-subtle text-[11px]">
                    <span
                      className={`font-semibold ${
                        isSoldOut
                          ? 'text-text-secondary line-through'
                          : isFillingFast
                          ? 'text-text-primary underline decoration-brand'
                          : 'text-brand'
                      }`}
                    >
                      {isSoldOut ? 'Sold Out' : isFillingFast ? 'Filling Fast' : 'Available'}
                    </span>
                    <span className="font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Select Seats →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
