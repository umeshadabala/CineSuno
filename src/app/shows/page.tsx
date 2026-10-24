'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Movie, Show, ShowSeatMapResponse, ShowSeat, PriceQuote } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { ShowtimePicker } from '@/components/ShowtimePicker';
import { SeatMap } from '@/components/SeatMap';
import { CheckoutModal } from '@/components/CheckoutModal';

function ShowsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const movieId = searchParams.get('movieId') || 'mov-01';
  const showId = searchParams.get('showId');

  const [movie, setMovie] = useState<Movie | null>(null);
  const [activeShow, setActiveShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [checkoutData, setCheckoutData] = useState<{
    show: Show;
    seatMap: ShowSeatMapResponse;
    selectedSeats: ShowSeat[];
    quote: PriceQuote;
  } | null>(null);

  // Load movie details
  useEffect(() => {
    let isCurrent = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const movieRes = await apiClient.getMovieById(movieId);
        if (!isCurrent) return;
        if (movieRes.success) {
          setMovie(movieRes.data);
        } else {
          setError(movieRes.error.message || 'Movie not found.');
        }

        // If a specific showId is requested in URL, fetch shows to match it
        if (showId) {
          const showsRes = await apiClient.getShows({ movieId });
          if (!isCurrent) return;
          if (showsRes.success) {
            const found = showsRes.data.find((s) => s.id === showId);
            if (found) setActiveShow(found);
          }
        }
      } catch {
        if (isCurrent) setError('Network error loading showtime page.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isCurrent = false;
    };
  }, [movieId, showId]);

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col font-sans transition-colors">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-brand transition shadow-xs"
          >
            ← Back to Movies
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-sm">Loading showtimes...</p>
          </div>
        ) : error || !movie ? (
          <div className="rounded-3xl border border-border-subtle bg-surface p-8 text-center max-w-md mx-auto shadow-sm">
            <h2 className="text-lg font-bold text-text-primary">Movie Unavailable</h2>
            <p className="mt-2 text-xs text-text-secondary">{error || 'Could not load movie information.'}</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-xs"
            >
              Browse All Movies
            </Link>
          </div>
        ) : activeShow ? (
          <SeatMap
            show={activeShow}
            onBack={() => setActiveShow(null)}
            onProceedToCheckout={(data) => setCheckoutData(data)}
          />
        ) : (
          <div className="rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">
                  Select Showtime & Cinema
                </span>
                <h1 className="text-3xl font-black text-text-primary mt-1">{movie.title}</h1>
                <p className="text-xs text-text-secondary mt-1">
                  {movie.certificate} • {movie.runtimeMinutes} mins • {movie.languages.join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface-elevated border border-border-subtle px-3 py-1 text-xs font-bold text-brand">
                  ★ {movie.rating?.toFixed(1) || '8.5'} Rating
                </span>
              </div>
            </div>

            <ShowtimePicker
              movie={movie}
              onSelectShow={(show) => {
                setActiveShow(show);
              }}
            />
          </div>
        )}
      </main>

      {checkoutData && (
        <CheckoutModal
          show={checkoutData.show}
          seatMap={checkoutData.seatMap}
          selectedSeats={checkoutData.selectedSeats}
          quote={checkoutData.quote}
          onClose={() => setCheckoutData(null)}
          onBookingConfirmed={() => {
            router.push('/');
          }}
        />
      )}
    </div>
  );
}

export default function ShowsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app-bg text-text-primary flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      }
    >
      <ShowsContent />
    </Suspense>
  );
}
