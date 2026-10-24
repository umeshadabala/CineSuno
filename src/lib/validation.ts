import type {
  ApiErrorCode,
  ApiErrorDetail,
  ApiErrorResponse,
  ApiSuccessResponse,
  MovieSearchParams,
  MovieStatus,
  ShowSearchParams,
} from '@/types';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorDetail };

/**
 * Creates a standardized success response envelope.
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return response;
}

/**
 * Creates a standardized error response envelope.
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  field?: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  const error: ApiErrorDetail = {
    code,
    message,
  };
  if (field) {
    error.field = field;
  }
  if (details) {
    error.details = details;
  }
  return {
    success: false,
    error,
  };
}

const VALID_MOVIE_STATUSES: Set<MovieStatus> = new Set(['now_showing', 'coming_soon', 'ended']);

/**
 * Validates query parameters for GET /api/movies.
 */
export function validateMovieSearchParams(searchParams: URLSearchParams): ValidationResult<MovieSearchParams> {
  const query = searchParams.get('query')?.trim() || undefined;
  const language = searchParams.get('language')?.trim() || undefined;
  const genre = searchParams.get('genre')?.trim() || undefined;
  const statusParam = searchParams.get('status')?.trim().toLowerCase() || undefined;

  let status: MovieStatus | undefined = undefined;
  if (statusParam) {
    if (!VALID_MOVIE_STATUSES.has(statusParam as MovieStatus)) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid movie status '${statusParam}'. Allowed values are: ${Array.from(VALID_MOVIE_STATUSES).join(', ')}`,
          field: 'status',
        },
      };
    }
    status = statusParam as MovieStatus;
  }

  return {
    success: true,
    data: {
      query,
      language,
      genre,
      status,
    },
  };
}

/**
 * Validates a YYYY-MM-DD date format and checks calendar validity.
 */
export function isValidDateFormat(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Validates query parameters for GET /api/shows.
 */
export function validateShowSearchParams(searchParams: URLSearchParams): ValidationResult<ShowSearchParams> {
  const movieId = searchParams.get('movieId')?.trim() || undefined;
  const cinemaId = searchParams.get('cinemaId')?.trim() || undefined;
  const date = searchParams.get('date')?.trim() || undefined;
  const city = searchParams.get('city')?.trim() || undefined;

  if (date && !isValidDateFormat(date)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: `Invalid date format '${date}'. Expected format: YYYY-MM-DD (e.g., 2026-10-25)`,
        field: 'date',
      },
    };
  }

  return {
    success: true,
    data: {
      movieId,
      cinemaId,
      date,
      city,
    },
  };
}
