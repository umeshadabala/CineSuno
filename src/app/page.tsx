'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Movie, MovieStatus, Show, ShowSeatMapResponse, ShowSeat, PriceQuote } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { NaturalLanguageSearch } from '@/components/NaturalLanguageSearch';
import { ParsedMovieQuery } from '@/lib/query-parser';
import {
  UserPreferences,
  getStoredPreferences,
  rankMoviesByPreferences,
} from '@/lib/preferences';
import { UserPreferencesModal } from '@/components/UserPreferencesModal';
import { RecommendedSection } from '@/components/RecommendedSection';
import { MovieFilterBar } from '@/components/MovieFilterBar';
import { MovieGrid } from '@/components/MovieGrid';
import { MovieDetailModal } from '@/components/MovieDetailModal';
import { SeatMap } from '@/components/SeatMap';
import { CheckoutModal } from '@/components/CheckoutModal';
import { useToast } from '@/lib/toast';
import { TicketIcon, XIcon } from '@/components/icons';

export default function HomePage() {
  const toast = useToast();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // City and Preferences state
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru');
  const [preferences, setPreferences] = useState<UserPreferences>(() => getStoredPreferences());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<MovieStatus | 'all'>('now_showing');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);

  // Modal & Booking Flow states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

  // Active Show for Seat Selection
  const [activeShow, setActiveShow] = useState<Show | null>(null);

  // Active Checkout state
  const [checkoutData, setCheckoutData] = useState<{
    show: Show;
    seatMap: ShowSeatMapResponse;
    selectedSeats: ShowSeat[];
    quote: PriceQuote;
  } | null>(null);

  // Success toast state
  const [confirmedNotification, setConfirmedNotification] = useState<string | null>(null);

  const heroSearchRef = useRef<HTMLDivElement>(null);

  // Fetch movies via apiClient
  useEffect(() => {
    let isMounted = true;

    async function fetchMovies() {
      const response = await apiClient.getMovies({
        query: searchQuery.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        language: selectedLanguage === 'All' ? undefined : selectedLanguage,
        genre: selectedGenre === 'All' ? undefined : selectedGenre,
      });

      if (!isMounted) return;

      if (response.success) {
        setMovies(response.data);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.error.message || 'Unable to retrieve movies.');
      }
      setIsLoading(false);
    }

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, statusFilter, selectedLanguage, selectedGenre, refreshIndex]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  // Natural Language Search Callback
  const handleParsedQueryChange = useCallback((parsed: ParsedMovieQuery) => {
    if (parsed.movieTitle) {
      setSearchQuery(parsed.movieTitle);
    } else if (parsed.rawQuery) {
      setSearchQuery(parsed.rawQuery);
    } else {
      setSearchQuery('');
    }

    if (parsed.language) {
      setSelectedLanguage(parsed.language);
    }

    if (parsed.genre) {
      setSelectedGenre(parsed.genre);
    }

    if (parsed.partySize) {
      setPartySize(parsed.partySize);
    }
  }, []);

  const handleClearQuery = useCallback(() => {
    setSearchQuery('');
    setSelectedLanguage('All');
    setSelectedGenre('All');
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedLanguage('All');
    setSelectedGenre('All');
    toast.info('Catalogue filters have been reset.');
  };

  // Compute recommendations based on preferences and loaded movies
  const recommendations = useMemo(() => {
    if (movies.length === 0) return [];
    return rankMoviesByPreferences(movies, preferences);
  }, [movies, preferences]);

  // Called when user selects a showtime from MovieDetailModal
  const handleSelectShowtime = (_movie: Movie, show: Show, selectedPartySize?: number) => {
    if (selectedPartySize) {
      setPartySize(selectedPartySize);
    }
    setSelectedMovie(null);
    setActiveShow(show);
  };

  const scrollToHeroSearch = () => {
    if (heroSearchRef.current) {
      heroSearchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = heroSearchRef.current.querySelector('input');
      input?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col font-sans selection:bg-brand selection:text-white transition-colors">
      {/* Global Navigation Header with Integrated Theme Toggle */}
      <Header
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        onVoiceClick={scrollToHeroSearch}
        onPreferencesClick={() => setIsPreferencesOpen(true)}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Success Booking Alert Banner */}
        {confirmedNotification && (
          <div className="mb-6 rounded-2xl border border-border-subtle bg-selected p-4 text-brand flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <TicketIcon className="h-5 w-5 text-brand shrink-0" />
              <span className="text-sm font-semibold text-text-primary">{confirmedNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmedNotification(null)}
              className="text-text-secondary hover:text-brand p-1"
              aria-label="Dismiss alert"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* If Active Seat Map is selected, render Interactive Seat Selection View */}
        {activeShow ? (
          <section className="animate-in fade-in duration-300">
            <SeatMap
              show={activeShow}
              initialTicketCount={partySize}
              onBack={() => setActiveShow(null)}
              onSwitchShow={(newShow) => {
                setActiveShow(newShow);
              }}
              onProceedToCheckout={(data) => {
                setCheckoutData(data);
              }}
            />
          </section>
        ) : (
          <>
            {/* Compact, Confident Hero Section */}
            <section
              ref={heroSearchRef}
              className="relative mb-6 overflow-hidden rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm transition-colors"
            >
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-xs font-bold text-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                  <span>Voice-First Cinema Ticketing Prototype</span>
                </div>
                <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-text-primary">
                  Discover and Book Movies at the <span className="text-brand">Speed of Voice</span>
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                  Experience natural conversational ticketing for Indian cinemas. Search naturally by language, genre, or showtime, reserve seats on real-time interactive layouts, and simulate instant booking.
                </p>
              </div>

              {/* Natural Language & Voice Search Bar */}
              <div className="mt-5">
                <NaturalLanguageSearch
                  onParsedQueryChange={handleParsedQueryChange}
                  activeQuery={searchQuery}
                  onClearQuery={handleClearQuery}
                />
              </div>
            </section>

            {/* Transparent Preference-Aware Recommended Rail */}
            {!searchQuery && (
              <RecommendedSection
                recommendations={recommendations}
                preferences={preferences}
                onOpenPreferences={() => setIsPreferencesOpen(true)}
                onSelectMovie={(movie) => setSelectedMovie(movie)}
              />
            )}

            {/* Curated Movies Section */}
            <div id="movies-section" className="scroll-mt-20">
              {/* Filter Controls Bar */}
              <section aria-label="Movie filters">
                <MovieFilterBar
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  selectedGenre={selectedGenre}
                  onGenreChange={setSelectedGenre}
                  totalResults={movies.length}
                  onResetFilters={handleResetFilters}
                />
              </section>

              {/* Dynamic Movie Grid */}
              <section aria-label="Movie catalogue" className="mt-4">
                <MovieGrid
                  movies={movies}
                  isLoading={isLoading}
                  error={errorMessage}
                  onRetry={handleRetry}
                  onSelectMovie={(movie) => setSelectedMovie(movie)}
                  onResetFilters={handleResetFilters}
                />
              </section>
            </div>
          </>
        )}
      </main>

      {/* Movie Details Modal with Showtime Selection */}
      <MovieDetailModal
        movie={selectedMovie}
        selectedCity={selectedCity}
        initialPartySize={partySize}
        onClose={() => setSelectedMovie(null)}
        onSelectShowtime={handleSelectShowtime}
      />

      {/* Checkout Modal */}
      {checkoutData && (
        <CheckoutModal
          show={checkoutData.show}
          seatMap={checkoutData.seatMap}
          selectedSeats={checkoutData.selectedSeats}
          quote={checkoutData.quote}
          onClose={() => setCheckoutData(null)}
          onBookingConfirmed={(booking) => {
            setConfirmedNotification(
              `Booking confirmed! Ref: ${booking.reference} for ${booking.movieTitle || 'your movie'}.`
            );
          }}
        />
      )}

      {/* User Preferences Modal */}
      <UserPreferencesModal
        isOpen={isPreferencesOpen}
        currentPreferences={preferences}
        onClose={() => setIsPreferencesOpen(false)}
        onSave={(updated) => setPreferences(updated)}
      />

      {/* Minimal, Professional Footer */}
      <footer className="mt-16 border-t border-border-subtle bg-surface py-8 text-xs text-text-secondary transition-colors">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="font-bold text-text-primary">CineSuno</span>
            <span className="hidden sm:inline">•</span>
            <span>Indian Cinema Ticketing in {selectedCity}</span>
            <span className="hidden sm:inline">•</span>
            <span>Monochromatic Green (#356B62)</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-text-secondary">
            Demonstration prototype for Bolna Symphony Buildathon. All payments & seat locks are simulated.
          </div>
        </div>
      </footer>
    </div>
  );
}
