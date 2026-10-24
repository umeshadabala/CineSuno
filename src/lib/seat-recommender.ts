import type {
  SeatRecommendationRequest,
  SeatRecommendationResult,
  ShowSeat,
} from '@/types';
import { getShowSeats } from './booking-state';

export type RecommendationResult =
  | { success: true; data: SeatRecommendationResult }
  | {
      success: false;
      error: {
        code: 'NOT_FOUND' | 'INVALID_TICKET_COUNT' | 'SEAT_UNAVAILABLE';
        message: string;
      };
    };

interface SeatGroup {
  seats: ShowSeat[];
  score: number;
  isAdjacent: boolean;
  totalPricePaise: number;
}

/**
 * Deterministically recommends the best available seats for a show.
 */
export function recommendSeats(request: SeatRecommendationRequest): RecommendationResult {
  const {
    showId,
    seatCount,
    adjacentSeatsOnly = false,
    preferredZone,
    preferredCategory,
    maxBudgetPaise,
  } = request;

  // Validate party size
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 20) {
    return {
      success: false,
      error: {
        code: 'INVALID_TICKET_COUNT',
        message: `Ticket count must be an integer between 1 and 20. Received: ${seatCount}`,
      },
    };
  }

  // Retrieve show seats with availability
  const allSeats = getShowSeats(showId);
  if (!allSeats) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Show with ID '${showId}' was not found.`,
      },
    };
  }

  const availableSeats = allSeats.filter((seat) => seat.status === 'available');

  if (availableSeats.length < seatCount) {
    return {
      success: false,
      error: {
        code: 'SEAT_UNAVAILABLE',
        message: `Only ${availableSeats.length} seat(s) available, but ${seatCount} was requested.`,
      },
    };
  }

  // Group available seats by row
  const seatsByRow = new Map<string, ShowSeat[]>();
  for (const seat of availableSeats) {
    const rowList = seatsByRow.get(seat.row) ?? [];
    rowList.push(seat);
    seatsByRow.set(seat.row, rowList);
  }

  // Sort seats in each row by seat number
  for (const rowList of seatsByRow.values()) {
    rowList.sort((a, b) => a.number - b.number);
  }

  const candidateGroups: SeatGroup[] = [];

  // 1. Find contiguous adjacent seat blocks in each row
  for (const [, rowSeats] of seatsByRow) {
    if (rowSeats.length >= seatCount) {
      for (let i = 0; i <= rowSeats.length - seatCount; i++) {
        const slice = rowSeats.slice(i, i + seatCount);
        // Check if slice is strictly contiguous
        let isConsecutive = true;
        for (let j = 0; j < slice.length - 1; j++) {
          if (slice[j + 1].number !== slice[j].number + 1) {
            isConsecutive = false;
            break;
          }
        }

        if (isConsecutive) {
          const totalPrice = slice.reduce((sum, s) => sum + s.pricePaise, 0);
          if (!maxBudgetPaise || totalPrice <= maxBudgetPaise) {
            candidateGroups.push({
              seats: slice,
              isAdjacent: true,
              totalPricePaise: totalPrice,
              score: calculateGroupScore(slice, preferredZone, preferredCategory, true),
            });
          }
        }
      }
    }
  }

  // 2. If adjacentSeatsOnly is false and no adjacent groups exist, consider non-adjacent combinations
  if (candidateGroups.length === 0 && !adjacentSeatsOnly) {
    // Pick the top individual available seats ranked by score
    const scoredIndividualSeats = availableSeats
      .map((seat) => ({
        seat,
        score: calculateIndividualScore(seat, preferredZone, preferredCategory),
      }))
      .sort((a, b) => b.score - a.score);

    // Filter by budget if applicable
    const selectedSeats: ShowSeat[] = [];
    let runningTotal = 0;

    for (const item of scoredIndividualSeats) {
      if (selectedSeats.length < seatCount) {
        if (!maxBudgetPaise || runningTotal + item.seat.pricePaise <= maxBudgetPaise) {
          selectedSeats.push(item.seat);
          runningTotal += item.seat.pricePaise;
        }
      }
    }

    if (selectedSeats.length === seatCount) {
      candidateGroups.push({
        seats: selectedSeats,
        isAdjacent: false,
        totalPricePaise: runningTotal,
        score: calculateGroupScore(selectedSeats, preferredZone, preferredCategory, false),
      });
    }
  }

  // If no candidate group could be formed
  if (candidateGroups.length === 0) {
    if (adjacentSeatsOnly) {
      return {
        success: false,
        error: {
          code: 'SEAT_UNAVAILABLE',
          message: `Unable to find ${seatCount} consecutive adjacent seats together for this show. Try searching without the adjacent seats requirement.`,
        },
      };
    }

    if (maxBudgetPaise) {
      return {
        success: false,
        error: {
          code: 'SEAT_UNAVAILABLE',
          message: `No combination of ${seatCount} available seats found within the budget of ₹${(maxBudgetPaise / 100).toFixed(2)}.`,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'SEAT_UNAVAILABLE',
        message: `Unable to find suitable seats matching the specified criteria.`,
      },
    };
  }

  // Sort candidate groups deterministically: highest score first, then lowest total price
  candidateGroups.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.totalPricePaise - b.totalPricePaise;
  });

  const bestGroup = candidateGroups[0];
  const explanation = generateExplanation(bestGroup.seats, bestGroup.isAdjacent);

  return {
    success: true,
    data: {
      showId,
      recommendedSeatIds: bestGroup.seats.map((s) => s.id),
      score: bestGroup.score,
      explanation,
      seats: bestGroup.seats,
      totalPricePaise: bestGroup.totalPricePaise,
    },
  };
}

/**
 * Calculates a 0-100 heuristic ranking score for an individual seat.
 */
function calculateIndividualScore(
  seat: ShowSeat,
  preferredZone?: string,
  preferredCategory?: string
): number {
  let score = seat.viewScore;

  if (preferredZone && seat.zone.toLowerCase() === preferredZone.toLowerCase()) {
    score += 10;
  }
  if (preferredCategory && seat.category.toLowerCase() === preferredCategory.toLowerCase()) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates a combined heuristic score for a group of seats.
 */
function calculateGroupScore(
  seats: ShowSeat[],
  preferredZone?: string,
  preferredCategory?: string,
  isAdjacent: boolean = true
): number {
  if (seats.length === 0) return 0;

  const avgViewScore = seats.reduce((sum, s) => sum + s.viewScore, 0) / seats.length;
  let score = avgViewScore;

  if (isAdjacent) {
    score += 8;
  }

  // Zone bonus
  if (preferredZone) {
    const matchingZoneCount = seats.filter(
      (s) => s.zone.toLowerCase() === preferredZone.toLowerCase()
    ).length;
    score += (matchingZoneCount / seats.length) * 10;
  }

  // Category bonus
  if (preferredCategory) {
    const matchingCategoryCount = seats.filter(
      (s) => s.category.toLowerCase() === preferredCategory.toLowerCase()
    ).length;
    score += (matchingCategoryCount / seats.length) * 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Generates an explainable human-readable rationale for the recommended seats.
 */
function generateExplanation(seats: ShowSeat[], isAdjacent: boolean): string {
  const count = seats.length;
  const categories = Array.from(new Set(seats.map((s) => s.category)));
  const zones = Array.from(new Set(seats.map((s) => s.zone)));

  const categoryDesc = categories.length === 1 ? categories[0] : 'mixed tier';
  const zoneDesc = zones.length === 1 ? `${zones[0]} zone` : 'optimal viewing zones';

  if (isAdjacent) {
    return `${count} adjacent ${categoryDesc} seat${count > 1 ? 's' : ''} in the ${zoneDesc} with optimal center screen view.`;
  }

  return `${count} best available ${categoryDesc} seat${count > 1 ? 's' : ''} in the ${zoneDesc}.`;
}
