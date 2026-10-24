'use client';

import React, { useState } from 'react';
import { useToast } from '@/lib/toast';
import { AlertCircleIcon, XIcon } from '@/components/icons';

interface GroupSplitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticketCount: number;
  totalPricePaise: number;
  movieTitle?: string;
  showTime?: string;
  cinemaName?: string;
}

export default function GroupSplitDrawer({
  isOpen,
  onClose,
  ticketCount,
  totalPricePaise,
  movieTitle = 'Movie',
  showTime = 'Today',
  cinemaName = 'CineSuno Premiere',
}: GroupSplitDrawerProps) {
  const [participantCount, setParticipantCount] = useState<number>(Math.max(2, ticketCount));
  const [includeSnacksEstimate, setIncludeSnacksEstimate] = useState<boolean>(false);
  const toast = useToast();

  if (!isOpen) return null;

  // Add ₹150 per person for snacks if opted in
  const totalWithSnacksPaise = includeSnacksEstimate
    ? totalPricePaise + participantCount * 15000
    : totalPricePaise;

  const perPersonPaise = Math.ceil(totalWithSnacksPaise / Math.max(1, participantCount));
  const perPersonRupees = (perPersonPaise / 100).toFixed(2);
  const totalRupees = (totalWithSnacksPaise / 100).toFixed(2);

  const handleCopySummary = () => {
    const text = `Hey team! Here is the ticket split for ${movieTitle} at ${cinemaName} (${showTime}):\n` +
      `Total Payable: ₹${totalRupees}\n` +
      `Tickets: ${ticketCount} seats for ${participantCount} people\n` +
      `Your Share: ₹${perPersonRupees} per person.\n\n` +
      `Booked via CineSuno Voice-First Ticketing.`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Split summary copied! Share it on WhatsApp or SMS.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative h-full w-full max-w-md bg-surface border-l border-border-subtle p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Group Planning Tool
              </span>
              <h2 className="text-xl font-bold text-text-primary mt-0.5">Split Group Expenses</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition"
              aria-label="Close group split drawer"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Context Card */}
          <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-elevated/40 p-4 text-xs">
            <p className="font-bold text-text-primary text-sm">{movieTitle}</p>
            <p className="text-text-secondary mt-0.5">{cinemaName} • {showTime}</p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-subtle/40">
              <span className="text-text-secondary">Current Ticket Subtotal:</span>
              <span className="font-bold text-text-primary">₹{(totalPricePaise / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Stepper: Number of People Splitting */}
          <div className="mt-6">
            <label className="text-xs font-bold text-text-primary block mb-2">
              Number of People Splitting (1 to 20):
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setParticipantCount((c) => Math.max(1, c - 1))}
                className="h-10 w-10 rounded-xl border border-border-subtle bg-surface flex items-center justify-center font-bold text-text-primary hover:border-brand transition"
              >
                -
              </button>
              <div className="flex-1 rounded-xl border border-border-subtle bg-surface-elevated text-center py-2 font-mono text-base font-bold text-text-primary">
                {participantCount} {participantCount === 1 ? 'Person' : 'People'}
              </div>
              <button
                type="button"
                onClick={() => setParticipantCount((c) => Math.min(20, c + 1))}
                className="h-10 w-10 rounded-xl border border-border-subtle bg-surface flex items-center justify-center font-bold text-text-primary hover:border-brand transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Optional Snack Estimate Add-on */}
          <div className="mt-5">
            <label className="flex items-center gap-2.5 rounded-xl border border-border-subtle p-3 cursor-pointer hover:bg-surface-elevated/30 transition">
              <input
                type="checkbox"
                checked={includeSnacksEstimate}
                onChange={(e) => setIncludeSnacksEstimate(e.target.checked)}
                className="h-4 w-4 rounded accent-brand"
              />
              <div className="text-xs">
                <span className="font-bold text-text-primary">Add ₹150/person Snack Estimate</span>
                <p className="text-[10px] text-text-secondary">Popcorn + drink combo for planning group costs</p>
              </div>
            </label>
          </div>

          {/* Split Arithmetic Result Card */}
          <div className="mt-6 rounded-2xl border-2 border-brand/30 bg-surface-selected/40 p-5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Individual Contribution
            </span>
            <div className="text-3xl font-black text-text-primary mt-1">
              ₹{perPersonRupees}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              ₹{totalRupees} total split equally among {participantCount} people
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-elevated p-3 text-[10px] text-text-secondary border border-border-subtle">
            <AlertCircleIcon className="h-4 w-4 shrink-0 text-brand" />
            <p>
              This is a planning tool. No real money transfer occurs. Copy and share the calculation with your friends to collect your tickets share.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-hover transition shadow-xs"
          >
            Copy WhatsApp / SMS Split Text
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
