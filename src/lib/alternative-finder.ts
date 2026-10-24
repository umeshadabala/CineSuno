import { Show, Cinema } from '@/types';
import { calculateShowCost, ShowCostBreakdown } from '@/lib/cost-calculator';
import { UserPreferences } from '@/lib/preferences';

export interface AlternativeShowSuggestion {
  show: Show;
  cinema?: Cinema;
  relationType: 'nearby_time' | 'same_cinema' | 'different_cinema' | 'budget_friendly' | 'preference_match';
  reason: string;
  timeDifferenceMinutes: number;
  score: number;
  costBreakdown: ShowCostBreakdown;
  priceDiffFromTargetPaise: number; // candidate.totalPaise - target.totalPaise
  formattedPriceDiff: string;
  isCheaper: boolean;
  isSamePrice: boolean;
  statusLabel: string;
}

/**
 * Discovers genuine alternative showtimes from available data.
 * Ranks alternatives using a transparent scoring approach:
 * - Movie match (same movie highest)
 * - Time proximity
 * - Total payable price & savings for selected party size
 * - Cinema / location continuity
 * - User preference alignment (time of day, budget, language)
 * - Confirmed availability status
 */
export function findAlternativeShows(
  targetShow: Show,
  allShows: Show[],
  cinemas: Cinema[],
  userPrefs?: UserPreferences,
  partySize: number = 2
): AlternativeShowSuggestion[] {
  const targetTime = new Date(targetShow.startTime).getTime();
  const cinemaMap = new Map(cinemas.map((c) => [c.id, c]));
  const targetCost = calculateShowCost(targetShow, partySize);

  // Candidate pool: exclude the exact same show and sold-out shows
  const candidateShows = allShows.filter((s) => s.id !== targetShow.id && s.status !== 'sold_out');

  const suggestions: AlternativeShowSuggestion[] = [];

  for (const candidate of candidateShows) {
    const candidateTime = new Date(candidate.startTime).getTime();
    const diffMinutes = Math.round((candidateTime - targetTime) / (60 * 1000));
    const cinema = cinemaMap.get(candidate.cinemaId);
    const candidateCost = calculateShowCost(candidate, partySize);
    const priceDiff = candidateCost.totalPaise - targetCost.totalPaise;

    let score = 0;
    const reasons: string[] = [];

    // 1. Same movie preference
    const isSameMovie = candidate.movieId === targetShow.movieId;
    if (isSameMovie) {
      score += 100;
    } else {
      score += 30; // Different movie alternative
      reasons.push('Alternative title');
    }

    // 2. Cinema continuity
    const isSameCinema = candidate.cinemaId === targetShow.cinemaId;
    if (isSameCinema) {
      score += 35;
      reasons.push(`Same cinema (${cinema?.name || 'Same venue'})`);
    } else {
      score += 10;
      reasons.push(cinema?.name || 'Nearby cinema');
    }

    // 3. Time proximity scoring
    const absDiff = Math.abs(diffMinutes);
    if (absDiff <= 45) {
      score += 40;
    } else if (absDiff <= 90) {
      score += 30;
    } else if (absDiff <= 180) {
      score += 20;
    } else {
      score += Math.max(0, 10 - Math.round(absDiff / 60));
    }

    const timeStr = diffMinutes > 0 ? `${diffMinutes}m later` : `${Math.abs(diffMinutes)}m earlier`;
    reasons.push(timeStr);

    // 4. Cost and Budget Alignment
    const isCheaper = priceDiff < 0;
    const isSamePrice = priceDiff === 0;
    if (isCheaper) {
      const savingsRupees = Math.round(Math.abs(priceDiff) / 100);
      score += Math.min(30, 15 + Math.round(savingsRupees / 10));
      reasons.push(`Save ₹${savingsRupees}`);
    } else if (isSamePrice) {
      score += 10;
      reasons.push('Same price');
    }

    if (userPrefs?.maxBudgetPerTicketPaise && candidate.ticketPricePaise <= userPrefs.maxBudgetPerTicketPaise) {
      score += 15;
      reasons.push('Within budget');
    }

    // 5. User Preferred Time of Day
    if (userPrefs?.preferredTimeOfDay && userPrefs.preferredTimeOfDay !== 'any') {
      const hour = new Date(candidate.startTime).getHours();
      let matchesTime = false;
      if (userPrefs.preferredTimeOfDay === 'morning' && hour >= 6 && hour < 12) matchesTime = true;
      if (userPrefs.preferredTimeOfDay === 'afternoon' && hour >= 12 && hour < 17) matchesTime = true;
      if (userPrefs.preferredTimeOfDay === 'evening' && hour >= 17 && hour < 21) matchesTime = true;
      if (userPrefs.preferredTimeOfDay === 'night' && (hour >= 21 || hour < 2)) matchesTime = true;
      if (matchesTime) {
        score += 20;
        reasons.push(`Matches ${userPrefs.preferredTimeOfDay} slot`);
      }
    }

    // 6. Language continuity
    if (candidate.language === targetShow.language) {
      score += 20;
    }

    // Format difference text
    const formattedPriceDiff = isCheaper
      ? `Save ₹${Math.round(Math.abs(priceDiff) / 100)}`
      : priceDiff > 0
      ? `+₹${Math.round(priceDiff / 100)}`
      : 'Same price';

    let relationType: AlternativeShowSuggestion['relationType'] = 'nearby_time';
    if (isCheaper) relationType = 'budget_friendly';
    else if (isSameCinema) relationType = 'same_cinema';
    else relationType = 'different_cinema';

    suggestions.push({
      show: candidate,
      cinema,
      relationType,
      reason: reasons.join(' • '),
      timeDifferenceMinutes: diffMinutes,
      score,
      costBreakdown: candidateCost,
      priceDiffFromTargetPaise: priceDiff,
      formattedPriceDiff,
      isCheaper,
      isSamePrice,
      statusLabel: candidate.status === 'filling_fast' ? 'Filling Fast' : 'Available',
    });
  }

  // Sort by highest transparent score
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 4);
}
