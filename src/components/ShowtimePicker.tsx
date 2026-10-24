'use client';

import React, { useState, useEffect } from 'react';
import { Movie, Show } from '@/types';
import { apiClient } from '@/lib/api-client';
import { calculateShowCost } from '@/lib/cost-calculator';
import { findAlternativeShows } from '@/lib/alternative-finder';
import { getStoredPreferences } from '@/lib/preferences';
import { TicketQuantitySelector } from '@/components/ui/TicketQuantitySelector';
import { AlternativeShowFinder } from '@/components/AlternativeShowFinder';
import { CostOptimizerDrawer } from '@/components/CostOptimizerDrawer';
import { ClockIcon, ChevronRightIcon, RefreshCwIcon, SparklesIcon } from '@/components/icons';

interface ShowtimePickerProps {
  movie: Movie;
  selectedCity?: string;
  initialPartySize?: number;
  onSelectShow: (show: Show, partySize: number) => void;
}

export function ShowtimePicker({
  movie,
  selectedCity = 'Bengaluru',
  initialPartySize = 2,
  onSelectShow,
}: ShowtimePickerProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-24');
  const [partySize, setPartySize] = useState<number>(initialPartySize);
  const [isCostOptimizerOpen, setIsCostOptimizerOpen] = useState<boolean>(false);
  const [alternativeTargetShow, setAlternativeTargetShow] = useState<Show | null>(null);

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
    <div className="flex flex-col gap-5">
      {/* Date & Ticket Quantity Selector Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {dates.map((d) => {
            const isSelected = selectedDate === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setSelectedDate(d.value)}
                className={`flex flex-col items-center justify-center min-w-[80px] rounded-xl px-3.5 py-1.5 transition-all ${
                  isSelected
                    ? 'bg-brand text-white shadow-sm font-bold'
                    : 'border border-border-subtle bg-surface text-text-secondary hover:border-brand/50 hover:text-text-primary'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold">{d.label}</span>
                <span className="text-xs font-bold">{d.subLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Mandatory Reusable Ticket Quantity Selector */}
        <div className="flex items-center gap-2">
          <TicketQuantitySelector
            label="Ticket Quantity"
            quantity={partySize}
            onChange={setPartySize}
            min={1}
            max={20}
            size="sm"
          />
        </div>
      </div>

      {/* Shows Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-text-secondary">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-xs">Fetching verified showtimes from cinema partner...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border-subtle bg-surface p-6 text-center text-text-secondary">
          <p className="font-semibold text-text-primary">{error}</p>
          <button
            type="button"
            onClick={() => setSelectedDate(selectedDate)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-hover shadow-xs transition"
          >
            <RefreshCwIcon className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : shows.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-text-secondary">
          <p className="text-sm font-semibold text-text-primary">No showtimes available for this date.</p>
          <p className="mt-1 text-xs text-text-secondary">
            Please choose another date above or select a different cinema city.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Header with Total-Cost Optimizer Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <span>Available showtimes ({shows.length})</span>
              <button
                type="button"
                onClick={() => setIsCostOptimizerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-selected px-2.5 py-1 text-[11px] font-bold text-brand hover:bg-brand hover:text-white transition shadow-2xs"
              >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Total-Cost Optimizer</span>
              </button>
            </div>
            <span className="text-[11px] text-text-secondary">
              Includes ₹5/ticket convenience fee (capped at ₹30)
            </span>
          </div>

          {/* Alternative Show Finder Banner when a sold-out or targeted show is selected */}
          {alternativeTargetShow && (
            <AlternativeShowFinder
              currentShow={alternativeTargetShow}
              alternatives={findAlternativeShows(
                alternativeTargetShow,
                shows,
                [],
                getStoredPreferences(),
                partySize
              )}
              partySize={partySize}
              onSelectAlternative={(altShow) => {
                setAlternativeTargetShow(null);
                onSelectShow(altShow, partySize);
              }}
              onClose={() => setAlternativeTargetShow(null)}
            />
          )}

          {/* Show Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shows.map((show) => {
              const isFillingFast = show.status === 'filling_fast';
              const isSoldOut = show.status === 'sold_out';
              const cost = calculateShowCost(show, partySize);

              return (
                <div
                  key={show.id}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                    isSoldOut
                      ? 'border-border-subtle bg-surface-elevated/40 opacity-80'
                      : 'border-border-subtle bg-surface hover:border-brand hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isSoldOut) {
                      onSelectShow(show, partySize);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-brand shrink-0" />
                        <span className="text-base font-bold text-text-primary group-hover:text-brand transition-colors">
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
                      <p className="mt-1.5 text-xs text-text-secondary">{show.screenName || 'Screen 1'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-text-primary">{cost.formattedTotal}</span>
                      <span className="block text-[10px] text-text-secondary">
                        {partySize > 1 ? `${partySize} tickets total` : 'incl. ₹5 fee'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-border-subtle text-[11px]">
                    <span
                      className={`font-semibold ${
                        isSoldOut
                          ? 'text-red-500 dark:text-red-400 font-bold'
                          : isFillingFast
                          ? 'text-text-primary font-bold'
                          : 'text-brand'
                      }`}
                    >
                      {isSoldOut ? 'Sold Out' : isFillingFast ? 'Filling Fast' : 'Available'}
                    </span>

                    {isSoldOut ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAlternativeTargetShow(show);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                      >
                        <RefreshCwIcon className="w-3 h-3" />
                        <span>Find Alternatives</span>
                      </button>
                    ) : (
                      <span className="font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <span>Select {partySize} {partySize === 1 ? 'Seat' : 'Seats'}</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cost Optimizer Comparison Modal */}
          {shows.length > 0 && (
            <CostOptimizerDrawer
              baseShow={shows[0]}
              allShows={shows}
              partySize={partySize}
              isOpen={isCostOptimizerOpen}
              onClose={() => setIsCostOptimizerOpen(false)}
              onSelectShow={(selectedShow) => {
                setIsCostOptimizerOpen(false);
                onSelectShow(selectedShow, partySize);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
