import {
  ShowSeatMapResponse,
  ShowSeat,
  SeatRecommendationRequest,
  SeatRecommendationResult,
  CreateQuoteRequest,
  PriceQuote,
  CreateBookingRequest,
  Booking,
  ApiResponse,
} from '@/types';
import seatsData from '../../data/seats.json';
import cinemasData from '../../data/cinemas.json';
import moviesData from '../../data/movies.json';
import showsData from '../../data/shows.json';

/**
 * Isolated Frontend Mock Adapter for Seat Maps, Recommendations, and Quotes.
 *
 * This adapter is used exclusively as a fallback until Developer B implements
 * the corresponding backend endpoints:
 * - GET /api/shows/[id]/seats
 * - POST /api/seats/recommend
 * - POST /api/quotes
 * - POST /api/bookings
 *
 * Adheres 100% strictly to the contracts in `docs/API_CONTRACTS.md` and `src/types/index.ts`.
 */

// Simulated show-specific unavailable seats for realistic demo display
const MOCK_BUSY_SEATS_BY_SHOW: Record<string, string[]> = {
  'show-101': ['C4', 'C5', 'D6', 'D7', 'E3', 'E4', 'F2'],
  'show-102': ['B3', 'B4', 'C5', 'C6', 'D4', 'D5', 'D6', 'E5', 'E6'],
  'show-103': ['A1', 'A2', 'C7', 'C8', 'E9', 'E10'],
  'show-104': ['D1', 'D2', 'F5', 'F6'],
  'show-105': ['C1', 'C2', 'C3', 'D4', 'D5'],
};

export function getMockShowSeatMap(showId: string): ApiResponse<ShowSeatMapResponse> {
  const show = showsData.find((s) => s.id === showId) || showsData[0];
  const movie = moviesData.find((m) => m.id === show.movieId) || moviesData[0];
  const cinema = cinemasData.find((c) => c.id === show.cinemaId) || cinemasData[0];

  const busySeatIds = new Set(MOCK_BUSY_SEATS_BY_SHOW[showId] || ['C5', 'D5', 'D6']);

  const seats: ShowSeat[] = seatsData.map((seat) => {
    const isBooked = busySeatIds.has(seat.id);
    let pricePaise = show.ticketPricePaise;
    if (seat.category === 'premium') {
      pricePaise = Math.round(show.ticketPricePaise * 1.15 / 100) * 100;
    } else if (seat.category === 'recliner') {
      pricePaise = Math.round(show.ticketPricePaise * 1.45 / 100) * 100;
    }

    return {
      ...seat,
      zone: seat.zone as 'front' | 'middle' | 'back',
      category: seat.category as 'standard' | 'premium' | 'recliner',
      showId: show.id,
      status: isBooked ? 'booked' : 'available',
      pricePaise,
    };
  });

  const availableSeats = seats.filter((s) => s.status === 'available').length;

  return {
    success: true,
    data: {
      showId: show.id,
      cinema: {
        id: cinema.id,
        name: cinema.name,
        address: cinema.address,
        city: cinema.city,
        facilities: cinema.facilities,
      },
      movie: {
        ...movie,
        status: movie.status as 'now_showing' | 'coming_soon' | 'ended',
        certificate: movie.certificate as 'U' | 'UA' | 'A' | 'R',
      },
      show: {
        id: show.id,
        movieId: show.movieId,
        cinemaId: show.cinemaId,
        startTime: show.startTime,
        ticketPricePaise: show.ticketPricePaise,
        status: show.status as 'scheduled' | 'filling_fast' | 'sold_out' | 'cancelled',
        screenName: show.screenName,
        format: show.format as '2D' | '3D' | 'IMAX 2D' | 'IMAX 3D',
        language: show.language,
      },
      totalSeats: seats.length,
      availableSeats,
      seats,
    },
  };
}

export function getMockSeatRecommendation(
  request: SeatRecommendationRequest
): ApiResponse<SeatRecommendationResult> {
  const mapRes = getMockShowSeatMap(request.showId);
  if (!mapRes.success) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Show not found for recommendation.',
      },
    };
  }

  const { seats } = mapRes.data;
  const available = seats.filter((s) => s.status === 'available');

  const count = Math.max(1, Math.min(20, request.seatCount));
  const preferredZone = request.preferredZone || 'middle';
  const preferredCategory = request.preferredCategory || 'premium';

  // Group by row
  const rows: Record<string, ShowSeat[]> = {};
  available.forEach((s) => {
    if (!rows[s.row]) rows[s.row] = [];
    rows[s.row].push(s);
  });

  Object.values(rows).forEach((rowSeats) => {
    rowSeats.sort((a, b) => a.number - b.number);
  });

  // Find contiguous seats in a preferred row
  let candidateGroup: ShowSeat[] | null = null;
  const rowKeys = ['E', 'D', 'C', 'F', 'B', 'A'];

  for (const rowKey of rowKeys) {
    const rowSeats = rows[rowKey] || [];
    if (rowSeats.length < count) continue;

    for (let i = 0; i <= rowSeats.length - count; i++) {
      const slice = rowSeats.slice(i, i + count);
      // Check adjacency
      const isAdjacent = slice.every(
        (seat, idx) => idx === 0 || seat.number === slice[idx - 1].number + 1
      );
      if (isAdjacent) {
        candidateGroup = slice;
        break;
      }
    }
    if (candidateGroup) break;
  }

  if (!candidateGroup) {
    // Fall back to best scored available seats
    const sortedByScore = [...available].sort((a, b) => b.viewScore - a.viewScore);
    candidateGroup = sortedByScore.slice(0, count);
  }

  if (candidateGroup.length < count) {
    return {
      success: false,
      error: {
        code: 'SEAT_UNAVAILABLE',
        message: `Unable to find ${count} available seats matching requested criteria.`,
      },
    };
  }

  const totalPricePaise = candidateGroup.reduce((sum, s) => sum + s.pricePaise, 0);
  const avgScore = Math.round(
    candidateGroup.reduce((sum, s) => sum + s.viewScore, 0) / candidateGroup.length
  );

  return {
    success: true,
    data: {
      showId: request.showId,
      recommendedSeatIds: candidateGroup.map((s) => s.id),
      score: avgScore,
      explanation: `${count} prime ${preferredCategory} seats in ${preferredZone} zone with optimal center screen sightlines.`,
      seats: candidateGroup,
      totalPricePaise,
    },
  };
}

export function createMockQuote(request: CreateQuoteRequest): ApiResponse<PriceQuote> {
  const mapRes = getMockShowSeatMap(request.showId);
  if (!mapRes.success) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Show not found.' },
    };
  }

  const seats = mapRes.data.seats.filter((s) => request.seatIds.includes(s.id));
  const ticketCount = seats.length;

  if (ticketCount === 0 || ticketCount > 20) {
    return {
      success: false,
      error: {
        code: 'INVALID_TICKET_COUNT',
        message: 'Ticket count must be between 1 and 20.',
      },
    };
  }

  const subtotalPaise = seats.reduce((sum, s) => sum + s.pricePaise, 0);
  // Authoritative convenience fee formula: Math.min(ticketCount * 500, 3000)
  const convenienceFeePaise = Math.min(ticketCount * 500, 3000);
  const totalPaise = subtotalPaise + convenienceFeePaise;

  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);

  return {
    success: true,
    data: {
      id: `qte-${Date.now().toString(36)}`,
      showId: request.showId,
      seatIds: request.seatIds,
      ticketCount,
      subtotalPaise,
      convenienceFeePaise,
      additionalCharges: [],
      totalPaise,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: 'active',
    },
  };
}

export function createMockBooking(request: CreateBookingRequest): ApiResponse<Booking> {
  const quoteRes = createMockQuote({
    showId: request.showId,
    seatIds: request.seatIds,
  });

  if (!quoteRes.success) {
    return {
      success: false,
      error: quoteRes.error,
    };
  }

  const quote = quoteRes.data;
  const now = new Date();

  return {
    success: true,
    data: {
      id: `bkg-${Date.now().toString(36)}`,
      reference: `CS-${Math.floor(1000 + Math.random() * 9000)}-${request.seatIds[0] || 'X1'}`,
      showId: request.showId,
      seatIds: request.seatIds,
      quoteId: quote.id,
      ticketCount: quote.ticketCount,
      totalPaise: quote.totalPaise,
      status: 'pending_demo_payment',
      createdAt: now.toISOString(),
      customer: request.customer,
    },
  };
}
