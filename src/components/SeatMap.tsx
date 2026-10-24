'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Show,
  ShowSeat,
  ShowSeatMapResponse,
  PriceQuote,
  SeatRecommendationResult,
} from '@/types';
import { apiClient } from '@/lib/api-client';
import { TicketQuantitySelector } from '@/components/ui/TicketQuantitySelector';
import {
  SparklesIcon,
  XIcon,
  ChevronLeftIcon,
  AlertCircleIcon,
  InfoIcon,
  RefreshCwIcon,
} from '@/components/icons';
import { findAlternativeShows, AlternativeShowSuggestion } from '@/lib/alternative-finder';
import { getStoredPreferences } from '@/lib/preferences';
import { AlternativeShowFinder } from '@/components/AlternativeShowFinder';
import { useToast } from '@/lib/toast';
import dynamic from 'next/dynamic';
import GroupSplitDrawer from '@/components/GroupSplitDrawer';

const Auditorium3D = dynamic(() => import('@/components/auditorium/Auditorium3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-3xl border border-border-subtle bg-[#0c1311] text-xs text-text-secondary">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span>Initializing WebGL 3D Auditorium...</span>
      </div>
    </div>
  ),
});

interface SeatMapProps {
  show: Show;
  initialTicketCount?: number;
  onBack: () => void;
  onProceedToCheckout: (data: {
    show: Show;
    seatMap: ShowSeatMapResponse;
    selectedSeats: ShowSeat[];
    quote: PriceQuote;
  }) => void;
  onSwitchShow?: (newShow: Show) => void;
}

export function SeatMap({
  show,
  initialTicketCount = 2,
  onBack,
  onProceedToCheckout,
  onSwitchShow,
}: SeatMapProps) {
  const toast = useToast();
  const [seatMapData, setSeatMapData] = useState<ShowSeatMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User target ticket count (1 to 20)
  const [ticketCount, setTicketCount] = useState<number>(initialTicketCount);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);

  // Recommendation state
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<SeatRecommendationResult | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isGroupSplitOpen, setIsGroupSplitOpen] = useState<boolean>(false);

  // Alternative show state
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const [alternatives, setAlternatives] = useState<AlternativeShowSuggestion[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<boolean>(false);

  const handleOpenAlternatives = async () => {
    if (showAlternatives) {
      setShowAlternatives(false);
      return;
    }
    setIsLoadingAlternatives(true);
    try {
      const res = await apiClient.getShows({ movieId: show.movieId });
      if (res.success) {
        const found = findAlternativeShows(show, res.data, [], getStoredPreferences(), ticketCount);
        setAlternatives(found);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingAlternatives(false);
      setShowAlternatives(true);
    }
  };

  const handleSelectAlternative = (newShow: Show) => {
    setShowAlternatives(false);
    setSelectedSeatIds([]);
    setQuote(null);
    setRecommendationMessage(null);
    if (onSwitchShow) {
      onSwitchShow(newShow);
      const timeStr = new Date(newShow.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      toast.info(`Switched to show at ${timeStr}`);
    }
  };

  const handleTicketCountChange = useCallback((newCount: number) => {
    setTicketCount(newCount);
    setSelectedSeatIds((prev) => {
      if (prev.length > newCount) {
        return prev.slice(0, newCount);
      }
      return prev;
    });
  }, []);

  // Fetch show seat map
  useEffect(() => {
    let isCurrent = true;

    async function loadSeatMap() {
      try {
        const res = await apiClient.getShowSeats(show.id);
        if (!isCurrent) return;
        if (res.success) {
          setSeatMapData(res.data);
          setErrorMessage(null);
        } else {
          setErrorMessage(res.error.message || 'Unable to load seat layout.');
        }
      } catch {
        if (isCurrent) setErrorMessage('Network connection error while fetching seat layout.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadSeatMap();

    return () => {
      isCurrent = false;
    };
  }, [show.id, refreshIndex]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setRefreshIndex((p) => p + 1);
  }, []);

  // Map of seats by ID for quick lookup
  const seatLookup = useMemo(() => {
    const map = new Map<string, ShowSeat>();
    seatMapData?.seats.forEach((seat) => map.set(seat.id, seat));
    return map;
  }, [seatMapData]);

  // Selected seat objects
  const selectedSeats = useMemo(() => {
    return selectedSeatIds
      .map((id) => seatLookup.get(id))
      .filter((s): s is ShowSeat => Boolean(s));
  }, [selectedSeatIds, seatLookup]);

  // Recalculate quote whenever selected seats change
  useEffect(() => {
    let isCurrent = true;

    async function updateQuote() {
      if (selectedSeatIds.length === 0) {
        setQuote(null);
        return;
      }

      setIsQuoteLoading(true);
      try {
        const res = await apiClient.createQuote({
          showId: show.id,
          seatIds: selectedSeatIds,
        });

        if (!isCurrent) return;

        if (res.success) {
          setQuote(res.data);
        } else {
          setQuote(null);
        }
      } catch {
        if (isCurrent) setQuote(null);
      } finally {
        if (isCurrent) setIsQuoteLoading(false);
      }
    }

    updateQuote();

    return () => {
      isCurrent = false;
    };
  }, [selectedSeatIds, show.id]);

  // Toggle seat selection
  const handleToggleSeat = (seat: ShowSeat) => {
    if (seat.status !== 'available') return;

    // Reset recommendation notice when user modifies seats manually
    setRecommendationMessage(null);

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }

      // If at or exceeding target ticket count, shift oldest seat
      if (prev.length >= ticketCount) {
        return [...prev.slice(1), seat.id];
      }

      return [...prev, seat.id];
    });
  };

  // AI Seat Recommendation
  const handleRequestRecommendation = async () => {
    setIsRecommending(true);
    setRecommendationMessage(null);
    try {
      const res = await apiClient.recommendSeats({
        showId: show.id,
        seatCount: ticketCount,
        adjacentSeatsOnly: true,
        preferredZone: 'middle',
        preferredCategory: 'premium',
      });

      if (res.success) {
        setRecommendation(res.data);
        setSelectedSeatIds(res.data.recommendedSeatIds);
        setRecommendationMessage(
          `CineSuno AI selected ${res.data.recommendedSeatIds.length} prime seats (${res.data.score}/100 match): ${res.data.explanation}`
        );
      } else {
        setRecommendationMessage(res.error.message || 'No recommendation available for current criteria.');
      }
    } catch {
      setRecommendationMessage('Failed to connect to recommendation service.');
    } finally {
      setIsRecommending(false);
    }
  };

  // Group seats by Category and Row for clear sectioning (Standard front, Premium middle, Recliner back)
  const categorizedRows = useMemo(() => {
    if (!seatMapData) return [];

    const categories: Array<{
      category: 'standard' | 'premium' | 'recliner';
      label: string;
      pricePaise: number;
      rows: Array<{ rowName: string; seats: ShowSeat[] }>;
    }> = [
      { category: 'standard', label: 'Classic Standard', pricePaise: 0, rows: [] },
      { category: 'premium', label: 'Prime Premium', pricePaise: 0, rows: [] },
      { category: 'recliner', label: 'Recliner Luxury', pricePaise: 0, rows: [] },
    ];

    const rowMap = new Map<string, ShowSeat[]>();
    seatMapData.seats.forEach((seat) => {
      if (!rowMap.has(seat.row)) rowMap.set(seat.row, []);
      rowMap.get(seat.row)!.push(seat);
    });

    rowMap.forEach((seats, rowName) => {
      seats.sort((a, b) => a.number - b.number);
      const cat = seats[0]?.category || 'standard';
      const target = categories.find((c) => c.category === cat);
      if (target) {
        if (!target.pricePaise) target.pricePaise = seats[0]?.pricePaise || show.ticketPricePaise;
        target.rows.push({ rowName, seats });
      }
    });

    // Filter out empty categories and sort rows front-to-back (Row A closest to screen, down to Row F at back)
    return categories
      .filter((c) => c.rows.length > 0)
      .map((c) => ({
        ...c,
        rows: c.rows.sort((a, b) => a.rowName.localeCompare(b.rowName)),
      }));
  }, [seatMapData, show.ticketPricePaise]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-brand border-t-transparent" />
        <div>
          <h2 className="text-lg font-bold text-text-primary">Loading Screen Layout</h2>
          <p className="text-xs text-text-secondary mt-1">Retrieving authoritative real-time seat availability...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errorMessage || !seatMapData) {
    return (
      <div className="rounded-3xl border border-border-subtle bg-surface p-8 text-center max-w-lg mx-auto shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-brand mb-3">
          <AlertCircleIcon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">Seat Availability Unavailable</h3>
        <p className="mt-1 text-sm text-text-secondary">{errorMessage || 'Could not load show seat map.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border-subtle bg-surface-elevated px-4 py-2 text-xs font-semibold text-text-primary hover:border-brand"
          >
            ← Back to Showtimes
          </button>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brand-hover shadow-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { cinema, movie } = seatMapData;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation & Show Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-border-subtle bg-surface-elevated p-2 text-text-secondary hover:text-text-primary hover:border-brand transition"
            aria-label="Back to showtimes"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-text-primary">{movie.title}</h2>
              <span className="rounded bg-surface-elevated px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                {movie.certificate}
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              {cinema.name} • {show.screenName || 'Screen 1'} • {show.format || '2D'} • {show.language}
            </p>
          </div>
        </div>

        {/* Ticket Quantity Selector (1 to 20) */}
        <div className="flex items-center self-end sm:self-auto">
          <TicketQuantitySelector
            quantity={ticketCount}
            onChange={handleTicketCountChange}
            min={1}
            max={20}
            label="Tickets"
          />
        </div>
      </div>

      {/* AI Seat Recommendation Banner */}
      <div className="rounded-2xl border border-border-subtle bg-surface-elevated/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                CineSuno AI Seat Finder
                <span className="rounded bg-surface border border-border-subtle px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                  Bolna AI Engine
                </span>
              </h3>
              <p className="text-xs text-text-secondary">
                Let our smart heuristic engine select the {ticketCount} best contiguous seats with optimal center-screen view.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAlternatives}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:border-brand transition shadow-2xs"
            >
              <RefreshCwIcon className={`w-3.5 h-3.5 text-brand ${isLoadingAlternatives ? 'animate-spin' : ''}`} />
              <span>{showAlternatives ? 'Hide Alternatives' : 'Compare Alternate Times'}</span>
            </button>

            <button
              type="button"
              disabled={isRecommending}
              onClick={handleRequestRecommendation}
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition disabled:opacity-50"
            >
              {isRecommending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing Layout...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  <span>Recommend Best {ticketCount} Seats</span>
                </>
              )}
            </button>
          </div>
        </div>

        {recommendationMessage && (
          <div className="mt-3 rounded-xl border border-border-subtle bg-selected px-3 py-2 text-xs text-text-primary flex items-center justify-between">
            <span>{recommendationMessage}</span>
            <button
              type="button"
              onClick={() => setRecommendationMessage(null)}
              className="text-text-secondary hover:text-text-primary ml-2 p-1"
              aria-label="Dismiss recommendation message"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Alternative Shows Panel if opened */}
        {showAlternatives && (
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <AlternativeShowFinder
              currentShow={show}
              alternatives={alternatives}
              partySize={ticketCount}
              onSelectAlternative={handleSelectAlternative}
              onClose={() => setShowAlternatives(false)}
            />
          </div>
        )}
      </div>

      {/* 3D vs 2D View Switcher & Group Split Tool */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-elevated border border-border-subtle">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs ${
              viewMode === '3d'
                ? 'bg-brand text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            3D Auditorium View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs ${
              viewMode === '2d'
                ? 'bg-brand text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            2D Seat Grid
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsGroupSplitOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3.5 py-1.5 text-xs font-bold text-text-primary hover:border-brand transition shadow-xs"
        >
          <span>Split Group Expenses</span>
        </button>
      </div>

      {viewMode === '3d' ? (
        <Auditorium3D
          seats={seatMapData.seats}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={(seatId) => {
            const s = seatLookup.get(seatId);
            if (s) handleToggleSeat(s);
          }}
          maxSeats={20}
          onSwitchTo2D={() => setViewMode('2d')}
        />
      ) : (
        <>
          {/* Screen Representation */}
          <div className="relative py-4 text-center">
            <div className="mx-auto w-3/4 max-w-lg h-2 rounded-full bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_15px_var(--focus-ring)]" />
            <span className="block mt-2 text-[10px] uppercase tracking-widest font-extrabold text-text-secondary">
              All eyes this way • Screen
            </span>
          </div>

      {/* Interactive Seat Grid by Category */}
      <div className="flex flex-col gap-6 overflow-x-auto pb-4 pt-2">
        {categorizedRows.map((catSection) => (
          <div key={catSection.category} className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-border-subtle pb-1 text-xs">
              <span className="font-bold text-text-primary flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand" />
                {catSection.label}
              </span>
              <span className="font-semibold text-text-secondary">
                ₹{Math.round(catSection.pricePaise / 100)} / seat
              </span>
            </div>

            <div className="flex flex-col gap-2.5 items-center justify-center py-2">
              {catSection.rows.map((rowObj) => (
                <div key={rowObj.rowName} className="flex items-center gap-2 sm:gap-3">
                  {/* Row Letter Indicator */}
                  <span className="w-5 text-center text-xs font-bold text-text-secondary">
                    {rowObj.rowName}
                  </span>

                  {/* Seats in Row */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowObj.seats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isBooked = seat.status === 'booked';
                      const isHeld = seat.status === 'held';
                      const isRecommended =
                        recommendation?.recommendedSeatIds.includes(seat.id) && isSelected;

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={isBooked || isHeld}
                          onClick={() => handleToggleSeat(seat)}
                          tabIndex={isBooked || isHeld ? -1 : 0}
                          aria-label={`Seat ${seat.id}, ${seat.category}, ₹${Math.round(
                            seat.pricePaise / 100
                          )}, ${seat.status}`}
                          className={`group relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[10px] sm:text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-focus ${
                            isSelected
                              ? 'bg-brand text-white shadow-md shadow-brand/30 scale-105 font-black ring-2 ring-focus'
                              : isBooked
                              ? 'bg-surface-elevated/40 border border-border-subtle text-text-secondary/40 cursor-not-allowed opacity-40 line-through'
                              : isHeld
                              ? 'bg-surface-elevated/60 border border-border-subtle text-text-secondary cursor-not-allowed opacity-60'
                              : 'bg-surface border border-border-subtle text-text-primary hover:border-brand hover:bg-selected hover:scale-105'
                          } ${seat.number === 3 || seat.number === 7 ? 'mr-3 sm:mr-4' : ''}`}
                        >
                          {seat.number}

                          {/* Hover Tooltip */}
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition rounded bg-surface border border-border-subtle px-2 py-0.5 text-[10px] text-text-primary shadow-xl whitespace-nowrap z-20">
                            {seat.id} • ₹{Math.round(seat.pricePaise / 100)}
                          </span>

                          {/* AI Recommendation Indicator */}
                          {isRecommended && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <span className="w-5 text-center text-xs font-bold text-text-secondary">
                    {rowObj.rowName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 rounded-2xl border border-border-subtle bg-surface p-3 text-xs text-text-secondary shadow-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-surface border border-border-subtle" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-brand shadow-xs" />
          <span className="text-text-primary font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-surface-elevated/40 border border-border-subtle opacity-50" />
          <span>Booked / Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-selected border-2 border-brand" />
          <span className="text-brand font-semibold">AI Recommended</span>
        </div>
      </div>
      </>
      )}

      {/* Bottom Sticky Action Drawer */}
      <div className="sticky bottom-4 z-30 rounded-3xl border border-border-subtle bg-surface/95 p-4 sm:p-5 shadow-xl backdrop-blur-xl transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Selected Seats Badges */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Selected Seats ({selectedSeats.length}/{ticketCount}):
              </span>
              {selectedSeats.length === 0 ? (
                <span className="text-xs text-text-secondary font-medium">
                  Please tap {ticketCount} seat{ticketCount > 1 ? 's' : ''} on the map above.
                </span>
              ) : selectedSeats.length !== ticketCount ? (
                <span className="text-xs font-bold text-brand flex items-center gap-1">
                  <InfoIcon className="h-3.5 w-3.5" />
                  {selectedSeats.length < ticketCount
                    ? `Select ${ticketCount - selectedSeats.length} more seat${ticketCount - selectedSeats.length > 1 ? 's' : ''} to match your ticket quantity.`
                    : `Remove ${selectedSeats.length - ticketCount} seat${selectedSeats.length - ticketCount > 1 ? 's' : ''} to match your ticket quantity.`}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
              {selectedSeats.length === 0 ? (
                <span className="text-xs text-text-secondary italic">No seats selected yet.</span>
              ) : (
                selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-selected px-2.5 py-1 text-xs font-bold text-text-primary"
                  >
                    <span>{seat.id}</span>
                    <span className="text-[10px] text-text-secondary font-semibold">
                      ₹{Math.round(seat.pricePaise / 100)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSeat(seat)}
                      className="ml-1 p-0.5 text-text-secondary hover:text-brand"
                      aria-label={`Remove seat ${seat.id}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Pricing Breakdown & Checkout Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t border-border-subtle pt-3 md:border-t-0 md:pt-0">
            {quote && (
              <div className="flex flex-col text-right">
                <div className="flex items-center justify-end gap-2 text-xs text-text-secondary">
                  <span>Tickets: ₹{Math.round(quote.subtotalPaise / 100)}</span>
                  <span>+</span>
                  <span title="₹5/ticket capped at ₹30 max">
                    Fee: ₹{Math.round(quote.convenienceFeePaise / 100)}
                  </span>
                </div>
                <div className="text-xl font-black text-text-primary">
                  Total: ₹{Math.round(quote.totalPaise / 100)}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={selectedSeats.length === 0 || selectedSeats.length !== ticketCount || isQuoteLoading}
              onClick={() => {
                if (quote && seatMapData && selectedSeats.length === ticketCount) {
                  onProceedToCheckout({
                    show,
                    seatMap: seatMapData,
                    selectedSeats,
                    quote,
                  });
                }
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isQuoteLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating Quote...
                </>
              ) : selectedSeats.length === 0 ? (
                `Select ${ticketCount} Seat${ticketCount > 1 ? 's' : ''}`
              ) : selectedSeats.length !== ticketCount ? (
                selectedSeats.length < ticketCount
                  ? `Need ${ticketCount - selectedSeats.length} More Seat${ticketCount - selectedSeats.length > 1 ? 's' : ''}`
                  : `Remove ${selectedSeats.length - ticketCount} Seat${selectedSeats.length - ticketCount > 1 ? 's' : ''}`
              ) : (
                `Proceed to Checkout (${selectedSeats.length} Tickets) →`
              )}
            </button>
          </div>
        </div>
      </div>

      <GroupSplitDrawer
        isOpen={isGroupSplitOpen}
        onClose={() => setIsGroupSplitOpen(false)}
        ticketCount={ticketCount}
        totalPricePaise={quote?.totalPaise || (selectedSeats.length * show.ticketPricePaise)}
        movieTitle={movie.title}
        showTime={new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        cinemaName={cinema.name}
      />
    </div>
  );
}
