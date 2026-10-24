import type { Movie, MovieSearchParams, Show, ShowDetails, ShowSearchParams } from '@/types';
import {
  getAllMovies,
  getAllShows,
  getCinemaById,
  getMovieById,
  getShowById,
} from './data-store';

/**
 * Searches and filters movies based on provided query parameters.
 */
export function searchMovies(params: MovieSearchParams = {}): Movie[] {
  let results = getAllMovies();

  // Filter by status if specified
  if (params.status) {
    results = results.filter((movie) => movie.status === params.status);
  }

  // Filter by query (title or synopsis)
  if (params.query) {
    const normalizedQuery = params.query.toLowerCase();
    results = results.filter(
      (movie) =>
        movie.title.toLowerCase().includes(normalizedQuery) ||
        movie.synopsis.toLowerCase().includes(normalizedQuery)
    );
  }

  // Filter by language
  if (params.language) {
    const normalizedLang = params.language.toLowerCase();
    results = results.filter((movie) =>
      movie.languages.some((l) => l.toLowerCase() === normalizedLang)
    );
  }

  // Filter by genre
  if (params.genre) {
    const normalizedGenre = params.genre.toLowerCase();
    results = results.filter((movie) =>
      movie.genres.some((g) => g.toLowerCase() === normalizedGenre)
    );
  }

  return results;
}

/**
 * Searches and filters showtimes based on provided query parameters.
 */
export function searchShows(params: ShowSearchParams = {}): Show[] {
  let results = getAllShows();

  // Filter by movieId
  if (params.movieId) {
    results = results.filter((show) => show.movieId === params.movieId);
  }

  // Filter by cinemaId
  if (params.cinemaId) {
    results = results.filter((show) => show.cinemaId === params.cinemaId);
  }

  // Filter by date (YYYY-MM-DD prefix of startTime ISO string)
  if (params.date) {
    const targetDate = params.date;
    results = results.filter((show) => show.startTime.startsWith(targetDate));
  }

  // Filter by city (requires cinema lookup)
  if (params.city) {
    const normalizedCity = params.city.toLowerCase();
    results = results.filter((show) => {
      const cinema = getCinemaById(show.cinemaId);
      return cinema && cinema.city.toLowerCase() === normalizedCity;
    });
  }

  return results;
}

/**
 * Retrieves full show details enriched with movie and cinema models.
 */
export function getShowDetails(showId: string): ShowDetails | undefined {
  const show = getShowById(showId);
  if (!show) return undefined;

  const movie = getMovieById(show.movieId);
  const cinema = getCinemaById(show.cinemaId);

  if (!movie || !cinema) return undefined;

  return {
    ...show,
    movie,
    cinema,
  };
}
