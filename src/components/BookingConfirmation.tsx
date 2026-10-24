'use client';

import React, { useState } from 'react';
import { Booking, Movie, Show, Cinema, ShowSeat } from '@/types';
import { CheckIcon, AlertCircleIcon } from '@/components/icons';
import { useToast } from '@/lib/toast';

interface BookingConfirmationProps {
  booking: Booking;
  movie?: Movie;
  show?: Show;
  cinema?: Cinema;
  selectedSeats?: ShowSeat[];
  onDone: () => void;
}

export default function BookingConfirmation({
  booking,
  movie,
  show,
  cinema,
  selectedSeats = [],
  onDone,
}: BookingConfirmationProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const toast = useToast();

  const formattedDate = show?.startTime
    ? new Date(show.startTime).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Today';

  const formattedTime = show?.startTime
    ? new Date(show.startTime).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '7:30 PM';

  const handleCopyReference = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(booking.reference);
      setCopied(true);
      toast.success('Booking reference copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-2xl transition-all my-8">
        {/* Success Header Animation */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 mb-4 animate-in zoom-in-50 duration-300">
            <CheckIcon className="h-8 w-8 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Booking Confirmed
          </span>
          <h2 className="text-2xl font-black text-text-primary mt-1">
            {movie?.title || 'Your Movie Tickets'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {cinema?.name || 'CineSuno Premiere Cinemas'} • {show?.screenName || 'Audi 1'}
          </p>
        </div>

        {/* High-Contrast M-Ticket Card */}
        <div className="mt-6 rounded-2xl border-2 border-border-subtle bg-white text-gray-900 p-6 shadow-sm relative overflow-hidden print:border-black">
          {/* Subtle ticket perforation side notches */}
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface border-r-2 border-border-subtle" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface border-l-2 border-border-subtle" />

          {/* Ticket Top Meta */}
          <div className="flex items-start justify-between border-b border-dashed border-gray-300 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Booking Reference
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-lg font-black tracking-wider text-gray-950">
                  {booking.reference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 hover:bg-gray-200 transition"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Ticket Count
              </p>
              <span className="text-sm font-bold text-gray-900">
                {booking.ticketCount} {booking.ticketCount === 1 ? 'Ticket' : 'Tickets'}
              </span>
            </div>
          </div>

          {/* Schedule & Seats Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-dashed border-gray-300 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Date & Showtime
              </p>
              <p className="font-bold text-gray-900 mt-0.5">{formattedDate}</p>
              <p className="text-gray-600">{formattedTime}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Seats Booked
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"
                    >
                      {s.row}{s.number}
                    </span>
                  ))
                ) : (
                  <span className="font-bold text-gray-900">
                    {booking.seatIds.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scannable M-Ticket QR Code Container */}
          <div className="flex flex-col items-center justify-center pt-5 pb-2 text-center">
            {/* Dynamic Geometric QR Pattern Simulation */}
            <div className="h-32 w-32 rounded-xl border-4 border-gray-950 p-2 bg-white flex flex-col justify-between shadow-inner">
              <div className="flex justify-between">
                <div className="h-7 w-7 bg-gray-950 p-1 flex items-center justify-center">
                  <div className="h-3 w-3 bg-white" />
                </div>
                <div className="h-2 w-10 bg-gray-800 mt-2" />
                <div className="h-7 w-7 bg-gray-950 p-1 flex items-center justify-center">
                  <div className="h-3 w-3 bg-white" />
                </div>
              </div>
              <div className="flex justify-center items-center gap-1 my-1">
                <div className="h-3 w-3 bg-gray-900" />
                <div className="h-4 w-4 bg-gray-800" />
                <div className="h-2 w-5 bg-gray-700" />
                <div className="h-3 w-3 bg-gray-900" />
              </div>
              <div className="flex justify-between items-end">
                <div className="h-7 w-7 bg-gray-950 p-1 flex items-center justify-center">
                  <div className="h-3 w-3 bg-white" />
                </div>
                <div className="h-2 w-8 bg-gray-800 mb-1" />
                <div className="h-4 w-4 bg-gray-900" />
              </div>
            </div>

            <p className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Scan at Cinema Gate Turnstile
            </p>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <AlertCircleIcon className="h-2.5 w-2.5" />
              <span>Prototype Demo Ticket • Simulated Transaction</span>
            </span>
          </div>

          {/* Amount Paid Breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-600">Simulated Amount Paid:</span>
            <span className="text-sm font-black text-gray-950">
              ₹{(booking.totalPaise / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-1/2 rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-xs font-bold text-text-primary hover:border-brand transition shadow-xs"
          >
            Print / Save M-Ticket
          </button>
          <button
            type="button"
            onClick={onDone}
            className="w-full sm:w-1/2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-hover transition shadow-xs"
          >
            Browse More Movies
          </button>
        </div>
      </div>
    </div>
  );
}
