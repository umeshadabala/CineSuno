'use client';

import React from 'react';
import { Show, Cinema } from '@/types';
import { compareShows, CostComparisonOption } from '@/lib/cost-calculator';
import { ClockIcon, XIcon, CheckIcon, InfoIcon, ChevronRightIcon } from '@/components/icons';

interface CostOptimizerDrawerProps {
  baseShow: Show;
  allShows: Show[];
  cinemas?: Cinema[];
  partySize: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectShow: (show: Show) => void;
}

export function CostOptimizerDrawer({
  baseShow,
  allShows,
  cinemas = [],
  partySize,
  isOpen,
  onClose,
  onSelectShow,
}: CostOptimizerDrawerProps) {
  if (!isOpen) return null;

  const cinemaMap = new Map(cinemas.map((c) => [c.id, c]));
  const comparisonOptions: CostComparisonOption[] = compareShows(baseShow, allShows, partySize);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cost-optimizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-6 shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-selected px-2.5 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider mb-1">
              <span>Total-Cost Optimizer</span>
            </div>
            <h2 id="cost-optimizer-title" className="text-xl font-black text-text-primary">
              Compare Showtimes & Payable Totals
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Side-by-side total cost comparison for <strong className="text-text-primary font-bold">{partySize} {partySize === 1 ? 'ticket' : 'tickets'}</strong>, including tickets and capped convenience fees.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition"
            aria-label="Close cost comparison"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Policy Banner */}
        <div className="mt-4 rounded-xl border border-border-subtle bg-surface-elevated p-3 text-xs text-text-secondary flex items-start gap-2.5">
          <InfoIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-text-primary">Integer Pricing Contract:</span> Base ticket price is calculated per ticket. CineSuno convenience fee is strictly ₹5 per ticket, capped at ₹30 max per booking. Totals below represent complete payable amounts for {partySize} seats.
          </div>
        </div>

        {/* Options List */}
        <div className="mt-5 space-y-3">
          {comparisonOptions.map((opt) => {
            const isCurrent = opt.show.id === baseShow.id;
            const cinema = cinemaMap.get(opt.show.cinemaId);
            const timeStr = new Date(opt.show.startTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={opt.show.id}
                className={`relative rounded-2xl border p-4 transition-all ${
                  isCurrent
                    ? 'border-brand bg-selected/30 shadow-xs ring-1 ring-brand'
                    : 'border-border-subtle bg-surface hover:border-brand/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Timing & Venue details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ClockIcon className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-base font-black text-text-primary">{timeStr}</span>
                      <span className="rounded bg-surface-elevated px-2 py-0.5 text-[10px] font-bold text-text-secondary border border-border-subtle">
                        {opt.show.format || '2D'}
                      </span>
                      {opt.show.language && (
                        <span className="rounded bg-surface-elevated px-2 py-0.5 text-[10px] text-text-secondary border border-border-subtle">
                          {opt.show.language}
                        </span>
                      )}
                      {opt.isLowestCost && (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          Lowest Cost
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary">
                      {cinema?.name || 'Cinema'} • {opt.show.screenName || 'Screen 1'}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-brand">
                        {opt.tradeOffNote}
                      </span>
                    </div>
                  </div>

                  {/* Right: Price Breakdown & Select Action */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <span className="text-lg font-black text-text-primary">
                          {opt.breakdown.formattedTotal}
                        </span>
                        {opt.isCheaper && (
                          <span className="rounded bg-brand/10 border border-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                            {opt.formattedDiff}
                          </span>
                        )}
                        {!opt.isCheaper && !opt.isSamePrice && (
                          <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-secondary border border-border-subtle">
                            {opt.formattedDiff}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-text-secondary">
                        Base: {opt.breakdown.formattedSubtotal} + Fee: {opt.breakdown.formattedConvenienceFee}
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand py-1 px-2.5 rounded-lg bg-selected">
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>Current Selection</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectShow(opt.show);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-hover transition"
                        >
                          <span>Switch to This Show</span>
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4 text-xs text-text-secondary">
          <span>Estimated Demo Totals based on current show fixture data</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-subtle px-4 py-2 font-semibold text-text-primary hover:bg-surface-elevated transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
