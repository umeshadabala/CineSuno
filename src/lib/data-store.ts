import type { Cinema, Movie, Seat, Show } from '@/types';
import moviesData from '../../data/movies.json';
import cinemasData from '../../data/cinemas.json';
import showsData from '../../data/shows.json';
import seatsData from '../../data/seats.json';

// Local immutable catalogue fixtures loaded into memory
const movies: Movie[] = moviesData as Movie[];
const cinemas: Cinema[] = cinemasData as Cinema[];
const shows: Show[] = showsData as Show[];
const seats: Seat[] = seatsData as Seat[];

// Fast lookup indices
const movieIndex = new Map<string, Movie>(movies.map((m) => [m.id, m]));
const cinemaIndex = new Map<string, Cinema>(cinemas.map((c) => [c.id, c]));
const showIndex = new Map<string, Show>(shows.map((s) => [s.id, s]));

/**
 * Returns all movies in the demo catalogue.
 */
export function getAllMovies(): Movie[] {
  return [...movies];
}

/**
 * Finds a specific movie by its unique identifier.
 */
export function getMovieById(id: string): Movie | undefined {
  return movieIndex.get(id);
}

/**
 * Returns all cinemas in the demo catalogue.
 */
export function getAllCinemas(): Cinema[] {
  return [...cinemas];
}

/**
 * Finds a specific cinema by its unique identifier.
 */
export function getCinemaById(id: string): Cinema | undefined {
  return cinemaIndex.get(id);
}

/**
 * Returns all scheduled shows in the demo catalogue.
 */
export function getAllShows(): Show[] {
  return [...shows];
}

/**
 * Finds a specific show by its unique identifier.
 */
export function getShowById(id: string): Show | undefined {
  return showIndex.get(id);
}

/**
 * Returns all physical seat layouts in the demo catalogue.
 */
export function getAllSeats(): Seat[] {
  return [...seats];
}

/**
 * Returns physical seats for a specific cinema.
 */
export function getSeatsByCinemaId(cinemaId: string): Seat[] {
  return seats.filter((s) => s.cinemaId === cinemaId);
}
