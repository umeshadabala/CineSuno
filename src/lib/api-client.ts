import {
  ApiResponse,
  Movie,
  MovieSearchParams,
  Show,
  ShowSearchParams,
  ShowSeatMapResponse,
  SeatRecommendationRequest,
  SeatRecommendationResult,
  CreateQuoteRequest,
  PriceQuote,
  CreateBookingRequest,
  Booking,
} from '@/types';
import { MOCK_MOVIES } from '@/mocks/movies';
import {
  getMockShowSeatMap,
  getMockSeatRecommendation,
  createMockQuote,
  createMockBooking,
} from '@/mocks/seats';

/**
 * CineSuno Typed Frontend API Client
 *
 * Exclusively handles network communication between client components
 * and backend route handlers as defined in docs/API_CONTRACTS.md.
 * If backend endpoints are pending or unavailable, safely falls back
 * to the verified mock adapter.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiClient {
  /**
   * Fetch movies list with optional query and filters.
   * Calls real GET /api/movies endpoint.
   */
  async getMovies(params?: MovieSearchParams): Promise<ApiResponse<Movie[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.query) searchParams.set('query', params.query);
      if (params?.language) searchParams.set('language', params.language);
      if (params?.genre) searchParams.set('genre', params.genre);
      if (params?.status) searchParams.set('status', params.status);

      const qs = searchParams.toString();
      const url = `${BASE_URL}/api/movies${qs ? `?${qs}` : ''}`;

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<Movie[]>;
      }
    } catch {
      // Backend route not available; fall through to mock adapter
    }

    // Mock Adapter Fallback
    return this.getMockMovies(params);
  }

  /**
   * Fetch a single movie by its unique identifier.
   * Calls real GET /api/movies/[id] endpoint.
   */
  async getMovieById(id: string): Promise<ApiResponse<Movie>> {
    try {
      const res = await fetch(`${BASE_URL}/api/movies/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<Movie>;
      }
    } catch {
      // Fall through to mock adapter
    }

    const movie = MOCK_MOVIES.find((m) => m.id === id);
    if (!movie) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Movie with ID "${id}" was not found.`,
        },
      };
    }

    return {
      success: true,
      data: movie,
    };
  }

  /**
   * Fetch shows list with optional filters (movieId, cinemaId, city, date).
   * Calls real GET /api/shows endpoint.
   */
  async getShows(params?: ShowSearchParams): Promise<ApiResponse<Show[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.movieId) searchParams.set('movieId', params.movieId);
      if (params?.cinemaId) searchParams.set('cinemaId', params.cinemaId);
      if (params?.city) searchParams.set('city', params.city);
      if (params?.date) searchParams.set('date', params.date);

      const qs = searchParams.toString();
      const url = `${BASE_URL}/api/shows${qs ? `?${qs}` : ''}`;

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<Show[]>;
      }
    } catch {
      // Fall through
    }

    return {
      success: true,
      data: [],
    };
  }

  /**
   * Fetch seat map and real-time availability for a specific show.
   * Calls GET /api/shows/[id]/seats if available, or falls back to the isolated adapter.
   */
  async getShowSeats(showId: string): Promise<ApiResponse<ShowSeatMapResponse>> {
    try {
      const res = await fetch(`${BASE_URL}/api/shows/${encodeURIComponent(showId)}/seats`, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<ShowSeatMapResponse>;
      }
    } catch {
      // Endpoint pending in backend; fallback to isolated adapter
    }

    return getMockShowSeatMap(showId);
  }

  /**
   * Request intelligent seat recommendations.
   * Calls POST /api/seats/recommend if available, or falls back to the isolated adapter.
   */
  async recommendSeats(request: SeatRecommendationRequest): Promise<ApiResponse<SeatRecommendationResult>> {
    try {
      const res = await fetch(`${BASE_URL}/api/seats/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<SeatRecommendationResult>;
      }
    } catch {
      // Fallback to isolated adapter
    }

    return getMockSeatRecommendation(request);
  }

  /**
   * Request validated price quote for selected seats.
   * Calls POST /api/quotes if available, or falls back to the isolated adapter.
   */
  async createQuote(request: CreateQuoteRequest): Promise<ApiResponse<PriceQuote>> {
    try {
      const res = await fetch(`${BASE_URL}/api/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<PriceQuote>;
      }
    } catch {
      // Fallback to isolated adapter
    }

    return createMockQuote(request);
  }

  /**
   * Create a provisional booking hold.
   * Calls POST /api/bookings if available, or falls back to the isolated adapter.
   */
  async createBooking(request: CreateBookingRequest): Promise<ApiResponse<Booking>> {
    try {
      const res = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (res.ok) {
        return (await res.json()) as ApiResponse<Booking>;
      }
    } catch {
      // Fallback to isolated adapter
    }

    return createMockBooking(request);
  }

  /**
   * Mock filter implementation ensuring contract parity during frontend development.
   */
  private getMockMovies(params?: MovieSearchParams): ApiResponse<Movie[]> {
    let result = [...MOCK_MOVIES];

    if (params?.status) {
      result = result.filter((m) => m.status === params.status);
    }

    if (params?.language && params.language !== 'All') {
      const langLower = params.language.toLowerCase();
      result = result.filter((m) =>
        m.languages.some((l) => l.toLowerCase() === langLower)
      );
    }

    if (params?.genre && params.genre !== 'All') {
      const genreLower = params.genre.toLowerCase();
      result = result.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === genreLower)
      );
    }

    if (params?.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.synopsis.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.languages.some((l) => l.toLowerCase() === q)
      );
    }

    return {
      success: true,
      data: result,
    };
  }
}

export const apiClient = new ApiClient();
