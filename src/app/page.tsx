'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Movie, MovieStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { Header } from '@/components/Header';
import { MovieFilterBar } from '@/components/MovieFilterBar';
import { MovieGrid } from '@/components/MovieGrid';
import { MovieDetailModal } from '@/components/MovieDetailModal';
import { VoiceAssistantBanner } from '@/components/VoiceAssistantBanner';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru');
  const [statusFilter, setStatusFilter] = useState<MovieStatus | 'all'>('now_showing');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Modal state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);

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

  // Handle voice command simulation from banner
  const handleVoiceCommand = (command: string) => {
    if (command.toLowerCase().includes('action')) {
      setSelectedGenre('Action');
    } else if (command.toLowerCase().includes('telugu')) {
      setSelectedLanguage('Telugu');
    } else if (command.toLowerCase().includes('hindi')) {
      setSelectedLanguage('Hindi');
    } else if (command.toLowerCase().includes('kalki')) {
      setSearchQuery('Kalki');
    } else if (command.toLowerCase().includes('best rated')) {
      setMovies((prev) => [...prev].sort((a, b) => (b.rating || 0) - (a.rating || 0)));
    } else {
      setSearchQuery(command);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedLanguage('All');
    setSelectedGenre('All');
  };

  const handleSelectShowtime = (movie: Movie) => {
    // Showtime discovery screen will be connected in Sprint 2 via /api/shows
    void movie;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Global Navigation Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        onVoiceClick={() => {
          setSearchQuery('Kalki');
        }}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Voice Assistant Showcase Banner */}
        <VoiceAssistantBanner onSampleVoiceCommand={handleVoiceCommand} />

        {/* Hero Section */}
        <section className="mb-6 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/40 to-zinc-950 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <span>⚡ Bolna Symphony Buildathon Prototype</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-white">
                Book Movies at the <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-amber-200">Speed of Voice</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                Discover blockbusters across India in Telugu, Hindi, Tamil, Kannada, and Malayalam. Converse with CineSuno to get intelligent seat recommendations and instant bookings.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-center min-w-[140px]">
                <span className="block text-2xl font-black text-rose-500">20</span>
                <span className="text-xs text-zinc-400 font-medium">Tickets / Booking Max</span>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-center min-w-[140px]">
                <span className="block text-2xl font-black text-amber-400">₹5</span>
                <span className="text-xs text-zinc-400 font-medium">Fee (Capped at ₹30)</span>
              </div>
            </div>
          </div>
        </section>

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
      </main>

      {/* Movie Details Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        selectedCity={selectedCity}
        onClose={() => setSelectedMovie(null)}
        onSelectShowtime={handleSelectShowtime}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">CineSuno</span>
            <span>•</span>
            <span>Voice-First Movie Ticketing Prototype</span>
          </div>
          <p className="text-zinc-600">
            Built for Bolna Symphony Buildathon. Simulated catalogue & mock ticketing engine.
          </p>
        </div>
      </footer>
    </div>
  );
}
