/**
 * CineSuno — Shared TypeScript Data Models & API Contracts
 *
 * Single authoritative source of truth for domain models, request/response
 * payloads, and API envelopes shared between Developer A (Frontend) and
 * Developer B (Backend).
 */

// ============================================================================
// 1. API Envelope & Standard Error Types
// ============================================================================

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INVALID_TICKET_COUNT'
  | 'SEAT_UNAVAILABLE'
  | 'SEAT_DUPLICATE'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_INVALID'
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_INVALID_STATE'
  | 'BOOKING_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'INTERNAL_ERROR';

export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// 2. Movie Domain Models
// ============================================================================

export type MovieStatus = 'now_showing' | 'coming_soon' | 'ended';

export type MovieCertificate = 'U' | 'UA' | 'A' | 'R';

export interface Movie {
  id: string;
  title: string;
  languages: string[];
  genres: string[];
  runtimeMinutes: number;
  certificate: MovieCertificate;
  synopsis: string;
  poster: string;
  status: MovieStatus;
  releaseDate?: string;
  rating?: number;
}

export interface MovieSearchParams {
  query?: string;
  language?: string;
  genre?: string;
  status?: MovieStatus;
}

// ============================================================================
// 3. Cinema Domain Models
// ============================================================================

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  facilities: string[];
}

// ============================================================================
// 4. Show & Showtime Domain Models
// ============================================================================

export type ShowStatus = 'scheduled' | 'filling_fast' | 'sold_out' | 'cancelled';

export interface Show {
  id: string;
  movieId: string;
  cinemaId: string;
  /** ISO 8601 string with timezone offset, e.g. "2026-10-25T18:30:00+05:30" */
  startTime: string;
  /** Base ticket price in integer Indian paise (e.g. 25000 = ₹250.00) */
  ticketPricePaise: number;
  status: ShowStatus;
  screenName?: string;
  format?: '2D' | '3D' | 'IMAX 2D' | 'IMAX 3D';
  language?: string;
}

export interface ShowSearchParams {
  movieId?: string;
  cinemaId?: string;
  date?: string; // YYYY-MM-DD
  city?: string;
}

export interface ShowDetails extends Show {
  movie: Movie;
  cinema: Cinema;
}

// ============================================================================
// 5. Seat & Show Seat Availability Models
// ============================================================================

export type SeatZone = 'front' | 'middle' | 'back';

export type SeatCategory = 'standard' | 'premium' | 'recliner';

export type SeatAvailabilityStatus = 'available' | 'held' | 'booked';

/**
 * Physical seat definition in a hall/screen.
 * A physical seat definition is immutable across shows.
 */
export interface Seat {
  id: string;
  cinemaId: string;
  row: string;
  number: number;
  zone: SeatZone;
  category: SeatCategory;
  /** View quality score (0-100) based on screen distance and center alignment */
  viewScore: number;
  aisle: boolean;
}

/**
 * Show-specific availability for a physical seat.
 * Availability is strictly show-dependent.
 */
export interface ShowSeatAvailability {
  showId: string;
  seatId: string;
  status: SeatAvailabilityStatus;
  /** Hold expiration timestamp in ISO 8601 format if seat is currently held */
  heldUntil?: string;
}

/**
 * Composite seat representation for frontend rendering of a show's seat map.
 */
export interface ShowSeat extends Seat {
  showId: string;
  status: SeatAvailabilityStatus;
  /** Final calculated seat price in integer Indian paise for this show & tier */
  pricePaise: number;
}

export interface ShowSeatMapResponse {
  showId: string;
  cinema: Cinema;
  movie: Movie;
  show: Show;
  seats: ShowSeat[];
  totalSeats: number;
  availableSeats: number;
}

// ============================================================================
// 6. Seat Recommendation Models
// ============================================================================

export interface SeatRecommendationRequest {
  showId: string;
  /** Number of seats to recommend (1-20) */
  seatCount: number;
  /** If true, recommended seats must be consecutively adjacent in the same row */
  adjacentSeatsOnly?: boolean;
  preferredZone?: SeatZone;
  preferredCategory?: SeatCategory;
  /** Maximum total budget for all tickets in integer Indian paise */
  maxBudgetPaise?: number;
}

export interface SeatRecommendationResult {
  showId: string;
  recommendedSeatIds: string[];
  /**
   * Internal heuristic ranking score (0-100).
   * Note: This score is a layout/proximity heuristic for demo ranking,
   * not a scientifically validated metric.
   */
  score: number;
  /** Human-readable rationale for the voice agent or UI explanation */
  explanation: string;
  seats: ShowSeat[];
  totalPricePaise: number;
}

// ============================================================================
// 7. Pricing & Price Quote Models
// ============================================================================

export type QuoteStatus = 'active' | 'expired' | 'consumed';

export interface QuoteLineItem {
  id: string;
  label: string;
  amountPaise: number;
  isDiscount?: boolean;
}

export interface CreateQuoteRequest {
  showId: string;
  seatIds: string[];
}

export interface PriceQuote {
  id: string;
  showId: string;
  seatIds: string[];
  ticketCount: number;
  /** Sum of individual base seat prices in integer paise */
  subtotalPaise: number;
  /**
   * Convenience fee calculated as: Math.min(ticketCount * 500, 3000) paise
   * (₹5 per ticket, strictly capped at ₹30 max)
   */
  convenienceFeePaise: number;
  /** Any itemized additional line items (e.g. 3D glasses, if applicable) */
  additionalCharges: QuoteLineItem[];
  /** Total payable amount in integer paise: subtotal + convenience fee + charges */
  totalPaise: number;
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  status: QuoteStatus;
}

// ============================================================================
// 8. Booking Domain Models
// ============================================================================

export type BookingStatus =
  | 'pending_confirmation'
  | 'pending_demo_payment'
  | 'confirmed'
  | 'failed'
  | 'expired';

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface CreateBookingRequest {
  quoteId: string;
  showId: string;
  seatIds: string[];
  customer?: CustomerInfo;
}

export interface Booking {
  id: string;
  /** Human-readable alphanumeric booking reference code (e.g. "CS-8921-X9") */
  reference: string;
  showId: string;
  seatIds: string[];
  quoteId: string;
  ticketCount: number;
  /** Total amount in integer Indian paise */
  totalPaise: number;
  status: BookingStatus;
  createdAt: string; // ISO 8601
  confirmedAt?: string; // ISO 8601
  paymentTimestamp?: string; // ISO 8601
  customer?: CustomerInfo;
  movieTitle?: string;
  cinemaName?: string;
  startTime?: string;
}

export interface ConfirmDemoPaymentRequest {
  bookingId: string;
  /** Optional payment method simulation tag (e.g. 'UPI', 'CARD', 'WALLET') */
  paymentMethod?: 'UPI' | 'CARD' | 'WALLET' | 'DEMO';
}

export interface ConfirmDemoPaymentResponse {
  bookingId: string;
  reference: string;
  status: 'confirmed';
  paymentReference: string;
  confirmedAt: string; // ISO 8601
  booking: Booking;
}
