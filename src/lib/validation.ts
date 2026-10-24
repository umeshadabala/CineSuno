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

const VALID_SEAT_ZONES = new Set(['front', 'middle', 'back']);
const VALID_SEAT_CATEGORIES = new Set(['standard', 'premium', 'recliner']);

/**
 * Validates request body for POST /api/seats/recommend.
 */
export function validateSeatRecommendationRequest(body: unknown): ValidationResult<{
  showId: string;
  seatCount: number;
  adjacentSeatsOnly?: boolean;
  preferredZone?: 'front' | 'middle' | 'back';
  preferredCategory?: 'standard' | 'premium' | 'recliner';
  maxBudgetPaise?: number;
}> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Request body must be a valid JSON object.',
      },
    };
  }

  const payload = body as Record<string, unknown>;

  // Validate showId
  if (!payload.showId || typeof payload.showId !== 'string' || payload.showId.trim() === '') {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Field "showId" is required and must be a non-empty string.',
        field: 'showId',
      },
    };
  }
  const showId = payload.showId.trim();

  // Validate seatCount
  if (
    payload.seatCount === undefined ||
    typeof payload.seatCount !== 'number' ||
    !Number.isInteger(payload.seatCount) ||
    payload.seatCount < 1 ||
    payload.seatCount > 20
  ) {
    return {
      success: false,
      error: {
        code: 'INVALID_TICKET_COUNT',
        message: `Field "seatCount" must be an integer between 1 and 20. Received: ${payload.seatCount}`,
        field: 'seatCount',
      },
    };
  }
  const seatCount = payload.seatCount;

  // Validate adjacentSeatsOnly
  let adjacentSeatsOnly: boolean | undefined = undefined;
  if (payload.adjacentSeatsOnly !== undefined) {
    if (typeof payload.adjacentSeatsOnly !== 'boolean') {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Field "adjacentSeatsOnly" must be a boolean.',
          field: 'adjacentSeatsOnly',
        },
      };
    }
    adjacentSeatsOnly = payload.adjacentSeatsOnly;
  }

  // Validate preferredZone
  let preferredZone: ('front' | 'middle' | 'back') | undefined = undefined;
  if (payload.preferredZone !== undefined) {
    if (
      typeof payload.preferredZone !== 'string' ||
      !VALID_SEAT_ZONES.has(payload.preferredZone.toLowerCase())
    ) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Field "preferredZone" must be one of: ${Array.from(VALID_SEAT_ZONES).join(', ')}.`,
          field: 'preferredZone',
        },
      };
    }
    preferredZone = payload.preferredZone.toLowerCase() as 'front' | 'middle' | 'back';
  }

  // Validate preferredCategory
  let preferredCategory: ('standard' | 'premium' | 'recliner') | undefined = undefined;
  if (payload.preferredCategory !== undefined) {
    if (
      typeof payload.preferredCategory !== 'string' ||
      !VALID_SEAT_CATEGORIES.has(payload.preferredCategory.toLowerCase())
    ) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Field "preferredCategory" must be one of: ${Array.from(VALID_SEAT_CATEGORIES).join(', ')}.`,
          field: 'preferredCategory',
        },
      };
    }
    preferredCategory = payload.preferredCategory.toLowerCase() as 'standard' | 'premium' | 'recliner';
  }

  // Validate maxBudgetPaise
  let maxBudgetPaise: number | undefined = undefined;
  if (payload.maxBudgetPaise !== undefined) {
    if (
      typeof payload.maxBudgetPaise !== 'number' ||
      !Number.isInteger(payload.maxBudgetPaise) ||
      payload.maxBudgetPaise <= 0
    ) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Field "maxBudgetPaise" must be a positive integer in Indian paise.',
          field: 'maxBudgetPaise',
        },
      };
    }
    maxBudgetPaise = payload.maxBudgetPaise;
  }

  return {
    success: true,
    data: {
      showId,
      seatCount,
      adjacentSeatsOnly,
      preferredZone,
      preferredCategory,
      maxBudgetPaise,
    },
  };
}
