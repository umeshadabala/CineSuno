'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Booking } from '@/types';
import BookingConfirmation from '@/components/BookingConfirmation';
import { CheckIcon, FilmIcon } from '@/components/icons';
import { useToast } from '@/lib/toast';

const emptySubscribe = () => () => {};

export default function BookingsPage() {
  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [cleared, setCleared] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Booking | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const toast = useToast();

  const persistedCity = React.useSyncExternalStore(
    emptySubscribe,
    () => {
      try {
        return localStorage.getItem('cinesuno_selected_city') || 'Bengaluru';
      } catch {
        return 'Bengaluru';
      }
    },
    () => 'Bengaluru'
  );

  const selectedCity = userCity || persistedCity;

  const bookings: Booking[] = React.useMemo(() => {
    if (!isMounted || cleared) return [];
    try {
      const stored = localStorage.getItem('cinesuno_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  }, [isMounted, cleared]);

  const handleCityChange = (city: string) => {
    setUserCity(city);
    try {
      localStorage.setItem('cinesuno_selected_city', city);
    } catch {
      // Ignore
    }
  };

  const handleClearBookings = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cinesuno_bookings');
      setCleared(true);
      toast.info('Local booking history cleared.');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col font-sans transition-colors">
      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Prototype Demo History
            </span>
            <h1 className="text-3xl font-black text-text-primary mt-1">My Bookings</h1>
            <p className="text-xs text-text-secondary mt-1">
              Active electronic M-Tickets stored in this browser session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isMounted && bookings.length > 0 && (
              <button
                type="button"
                onClick={handleClearBookings}
                className="rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-red-500 hover:border-red-300 transition shadow-xs"
              >
                Clear History
              </button>
            )}
            <Link
              href="/"
              className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover transition shadow-xs"
            >
              Browse Movies
            </Link>
          </div>
        </div>

        {!isMounted ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border border-border-subtle bg-surface p-12 text-center max-w-md mx-auto shadow-sm my-12">
            <div className="h-14 w-14 rounded-2xl bg-surface-elevated text-brand flex items-center justify-center mx-auto mb-4 border border-border-subtle">
              <FilmIcon className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">No Bookings Found</h2>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              You haven&apos;t booked any movie tickets yet. Pick a movie, choose your seats in the 3D auditorium, and confirm a simulated booking to see your tickets here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-hover shadow-xs transition"
            >
              Discover Now Showing Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => (
              <div
                key={b.id || b.reference}
                className="rounded-3xl border border-border-subtle bg-surface p-6 shadow-sm hover:border-brand transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                        <CheckIcon className="h-2.5 w-2.5" />
                        <span>Confirmed Demo Ticket</span>
                      </span>
                      <h3 className="text-lg font-black text-text-primary mt-2">
                        {b.movieTitle || 'Movie Ticket'}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {b.cinemaName || 'CineSuno Premiere Cinemas'}
                      </p>
                    </div>

                    <div className="text-right font-mono text-xs font-bold text-brand">
                      {b.reference}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-surface-elevated/40 p-3 text-xs border border-border-subtle/50">
                    <div>
                      <span className="text-[10px] text-text-secondary block">Date & Time</span>
                      <span className="font-semibold text-text-primary mt-0.5 block">
                        {b.startTime
                          ? new Date(b.startTime).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'Showtime Confirmed'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-secondary block">Seats ({b.ticketCount})</span>
                      <span className="font-bold text-brand mt-0.5 block truncate">
                        {b.seatIds.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-text-secondary text-[10px] block">Simulated Total</span>
                    <span className="font-black text-text-primary">
                      ₹{(b.totalPaise / 100).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTicket(b)}
                    className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-hover shadow-xs transition"
                  >
                    View M-Ticket QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View Selected Ticket Modal */}
      {activeTicket && (
        <BookingConfirmation
          booking={activeTicket}
          onDone={() => setActiveTicket(null)}
        />
      )}
    </div>
  );
}
