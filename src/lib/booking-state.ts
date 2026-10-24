import type {
  SeatAvailabilityStatus,
  ShowSeat,
  ShowSeatMapResponse,
} from '@/types';
import {
  getAllSeats,
  getCinemaById,
  getMovieById,
  getSeatsByCinemaId,
  getShowById,
} from './data-store';
import { calculateSeatPricePaise } from './pricing';

interface SeatState {
  status: SeatAvailabilityStatus;
  heldUntil?: string;
}

// In-memory single-process demo state store: showId -> (seatId -> SeatState)
const showSeatStore = new Map<string, Map<string, SeatState>>();

/**
 * Pre-seeds initial realistic seat occupancy for demo shows.
 */
function initializeShowSeats(showId: string, cinemaId: string): Map<string, SeatState> {
  const cinemaSeats = getSeatsByCinemaId(cinemaId);
  const layout = cinemaSeats.length > 0 ? cinemaSeats : getAllSeats();
  const seatMap = new Map<string, SeatState>();

  // Determine pre-booked demo seats based on show status
  const show = getShowById(showId);
  const preBookedSeatIds = new Set<string>();

  if (show?.status === 'filling_fast') {
    // Prime seats taken in filling_fast shows
    ['C5', 'C6', 'D4', 'D5', 'D6', 'D7', 'E4', 'E7'].forEach((id) => preBookedSeatIds.add(id));
  } else if (show?.status === 'sold_out') {
    layout.forEach((s) => preBookedSeatIds.add(s.id));
  } else {
    // Normal shows have a few random seats booked
    ['B3', 'B4', 'C2', 'E1', 'F9'].forEach((id) => preBookedSeatIds.add(id));
  }

  for (const seat of layout) {
    if (preBookedSeatIds.has(seat.id)) {
      seatMap.set(seat.id, { status: 'booked' });
    } else {
      seatMap.set(seat.id, { status: 'available' });
    }
  }

  return seatMap;
}

/**
 * Gets or initializes the mutable seat state map for a specific show.
 */
function getOrInitShowSeatMap(showId: string, cinemaId: string): Map<string, SeatState> {
  let seatMap = showSeatStore.get(showId);
  if (!seatMap) {
    seatMap = initializeShowSeats(showId, cinemaId);
    showSeatStore.set(showId, seatMap);
  }
  return seatMap;
}

/**
 * Expires any holds that have passed their expiration timestamp.
 */
function cleanExpiredHolds(seatMap: Map<string, SeatState>): void {
  const now = new Date().toISOString();
  for (const [, state] of seatMap) {
    if (state.status === 'held' && state.heldUntil && state.heldUntil <= now) {
      state.status = 'available';
      delete state.heldUntil;
    }
  }
}

/**
 * Retrieves all seats with real-time show status and calculated tier prices for a show.
 */
export function getShowSeats(showId: string): ShowSeat[] | undefined {
  const show = getShowById(showId);
  if (!show) return undefined;

  const cinemaSeats = getSeatsByCinemaId(show.cinemaId);
  const physicalSeats = cinemaSeats.length > 0 ? cinemaSeats : getAllSeats();
  const seatMap = getOrInitShowSeatMap(showId, show.cinemaId);

  cleanExpiredHolds(seatMap);

  return physicalSeats.map((seat) => {
    const state = seatMap.get(seat.id) ?? { status: 'available' };
    const pricePaise = calculateSeatPricePaise(show.ticketPricePaise, seat.category);

    return {
      ...seat,
      showId,
      status: state.status,
      pricePaise,
    };
  });
}

/**
 * Builds the complete ShowSeatMapResponse envelope payload for a show.
 */
export function getShowSeatMapResponse(showId: string): ShowSeatMapResponse | undefined {
  const show = getShowById(showId);
  if (!show) return undefined;

  const movie = getMovieById(show.movieId);
  const cinema = getCinemaById(show.cinemaId);
  if (!movie || !cinema) return undefined;

  const seats = getShowSeats(showId);
  if (!seats) return undefined;

  const totalSeats = seats.length;
  const availableSeats = seats.filter((s) => s.status === 'available').length;

  return {
    showId,
    cinema,
    movie,
    show,
    seats,
    totalSeats,
    availableSeats,
  };
}

/**
 * Updates seat availability status in the in-memory demo store.
 */
export function updateSeatAvailability(
  showId: string,
  seatIds: string[],
  status: SeatAvailabilityStatus,
  holdDurationSeconds: number = 600
): boolean {
  const show = getShowById(showId);
  if (!show) return false;

  const seatMap = getOrInitShowSeatMap(showId, show.cinemaId);
  cleanExpiredHolds(seatMap);

  // Validate all seats exist
  for (const seatId of seatIds) {
    if (!seatMap.has(seatId)) return false;
  }

  const now = new Date();
  const heldUntil = new Date(now.getTime() + holdDurationSeconds * 1000).toISOString();

  for (const seatId of seatIds) {
    const current = seatMap.get(seatId)!;
    current.status = status;
    if (status === 'held') {
      current.heldUntil = heldUntil;
    } else {
      delete current.heldUntil;
    }
  }

  return true;
}
