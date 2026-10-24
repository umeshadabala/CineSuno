import {
  ApiResponse,
  Movie,
  MovieSearchParams,
} from '@/types';
import { MOCK_MOVIES } from '@/mocks/movies';

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
          m.languages.some((l) => l.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      data: result,
    };
  }
}

export const apiClient = new ApiClient();
