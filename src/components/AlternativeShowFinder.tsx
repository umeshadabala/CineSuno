'use client';

import React from 'react';
import { Show } from '@/types';
import { AlternativeShowSuggestion } from '@/lib/alternative-finder';
import { RefreshCwIcon, XIcon, ClockIcon, ChevronRightIcon, AlertCircleIcon } from '@/components/icons';

interface AlternativeShowFinderProps {
  currentShow: Show;
  alternatives: AlternativeShowSuggestion[];
  partySize: number;
  onSelectAlternative: (show: Show) => void;
  onClose?: () => void;
}

export function AlternativeShowFinder({
  currentShow,
  alternatives,
  partySize,
  onSelectAlternative,
  onClose,
}: AlternativeShowFinderProps) {
  const currentShowTime = new Date(currentShow.startTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-sm my-4 transition-colors">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated text-brand border border-border-subtle">
            <RefreshCwIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-text-primary">
              Intelligent Alternate Showtimes (Current: {currentShowTime})
            </h4>
            <p className="text-[11px] text-text-secondary">
              Ranked by time proximity, ticket availability, and complete payable price for {partySize} {partySize === 1 ? 'seat' : 'seats'}.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-elevated transition"
            aria-label="Close alternative showtimes"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {alternatives.length === 0 ? (
        <div className="py-6 text-center text-text-secondary">
          <AlertCircleIcon className="w-8 h-8 mx-auto text-text-secondary/50 mb-2" />
          <p className="text-xs font-semibold text-text-primary">No direct alternatives found for this timing.</p>
          <p className="text-[11px] text-text-secondary mt-1 max-w-sm mx-auto">
            All other shows for this title on this date may be fully booked or outside candidate windows. Try selecting a different date or city above.
          </p>
        </div>
      ) : (
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {alternatives.map((alt) => {
            const showDate = new Date(alt.show.startTime);
            const timeStr = showDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={`alt-${alt.show.id}`}
                className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-elevated p-3.5 transition hover:border-brand/50 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="text-xs font-bold text-text-primary">
                        {timeStr} • {alt.show.format || '2D'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {alt.isCheaper && (
                        <span className="rounded bg-brand/10 border border-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                          {alt.formattedPriceDiff}
                        </span>
                      )}
                      {!alt.isCheaper && !alt.isSamePrice && (
                        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-secondary border border-border-subtle">
                          {alt.formattedPriceDiff}
                        </span>
                      )}
                      <span className="rounded-md bg-selected px-1.5 py-0.5 text-[10px] font-bold text-brand">
                        {alt.costBreakdown.formattedTotal}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1.5 text-[11px] font-medium text-brand">
                    {alt.reason}
                  </p>

                  <p className="mt-1 text-[10px] text-text-secondary">
                    {alt.cinema?.name || 'Partner Cinema'} • {alt.show.screenName || 'Screen 1'} • {alt.statusLabel}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">
                    Total for {partySize} {partySize === 1 ? 'ticket' : 'tickets'} (incl. fee)
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectAlternative(alt.show)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-bold text-white hover:bg-brand-hover transition shadow-2xs"
                  >
                    <span>Switch Show</span>
                    <ChevronRightIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
