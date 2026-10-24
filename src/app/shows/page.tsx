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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            ← Back to Movies
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            <p className="text-sm">Loading showtimes...</p>
          </div>
        ) : error || !movie ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center max-w-md mx-auto">
            <h2 className="text-lg font-bold text-white">Movie Unavailable</h2>
            <p className="mt-2 text-xs text-red-300">{error || 'Could not load movie information.'}</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
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
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Select Showtime & Cinema
                </span>
                <h1 className="text-3xl font-black text-white mt-1">{movie.title}</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  {movie.certificate} • {movie.runtimeMinutes} mins • {movie.languages.join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        </div>
      }
    >
      <ShowsContent />
    </Suspense>
  );
}
