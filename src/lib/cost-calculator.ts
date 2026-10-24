import { Show } from '@/types';

export interface ShowCostBreakdown {
  showId: string;
  ticketCount: number;
  basePricePerTicketPaise: number;
  subtotalPaise: number;
  convenienceFeePaise: number;
  totalPaise: number;
  perPersonPaise: number;
  formattedSubtotal: string;
  formattedConvenienceFee: string;
  formattedTotal: string;
  formattedPerPerson: string;
}

/**
 * Calculates show cost breakdown using backend pricing contracts.
 * Exactly ₹5 per ticket (500 paise), strictly capped at ₹30 (3000 paise).
 * 1-20 ticket bounds.
 */
export function calculateShowCost(show: Show, ticketCount: number = 1): ShowCostBreakdown {
  const boundedCount = Math.max(1, Math.min(20, Math.floor(ticketCount)));
  const basePricePerTicketPaise = show.ticketPricePaise;
  const subtotalPaise = basePricePerTicketPaise * boundedCount;

  // Backend Rule: Math.min(ticketCount * 500, 3000) paise
  const convenienceFeePaise = Math.min(boundedCount * 500, 3000);
  const totalPaise = subtotalPaise + convenienceFeePaise;
  const perPersonPaise = Math.round(totalPaise / boundedCount);

  return {
    showId: show.id,
    ticketCount: boundedCount,
    basePricePerTicketPaise,
    subtotalPaise,
    convenienceFeePaise,
    totalPaise,
    perPersonPaise,
    formattedSubtotal: `₹${(subtotalPaise / 100).toFixed(2)}`,
    formattedConvenienceFee: `₹${(convenienceFeePaise / 100).toFixed(2)}`,
    formattedTotal: `₹${(totalPaise / 100).toFixed(2)}`,
    formattedPerPerson: `₹${(perPersonPaise / 100).toFixed(2)}`,
  };
}

/**
 * Format paise to display rupees.
 */
export function formatPaise(paise: number): string {
  return `₹${Math.round(paise / 100)}`;
}

export interface CostComparisonOption {
  show: Show;
  breakdown: ShowCostBreakdown;
  diffFromBasePaise: number; // candidate - base
  formattedDiff: string;
  isCheaper: boolean;
  isSamePrice: boolean;
  savingsPaise: number;
  tradeOffNote: string;
  isLowestCost: boolean;
}

/**
 * Compares shows using the complete payable amount for the same party size.
 * Uses integer paise, accounts for ₹5 fee capped at ₹30, and explains trade-offs.
 */
export function compareShows(
  baseShow: Show,
  candidateShows: Show[],
  ticketCount: number
): CostComparisonOption[] {
  const boundedCount = Math.max(1, Math.min(20, Math.floor(ticketCount)));
  const baseBreakdown = calculateShowCost(baseShow, boundedCount);
  const baseTime = new Date(baseShow.startTime).getTime();

  // Deduplicate and filter out sold_out shows
  const validShows = candidateShows.filter((s) => s.status !== 'sold_out');
  if (!validShows.some((s) => s.id === baseShow.id)) {
    validShows.unshift(baseShow);
  }

  const calculated = validShows.map((show) => {
    const breakdown = calculateShowCost(show, boundedCount);
    const diff = breakdown.totalPaise - baseBreakdown.totalPaise;
    const showTime = new Date(show.startTime).getTime();
    const diffMinutes = Math.round((showTime - baseTime) / (60 * 1000));

    // Formulate trade-off note
    let tradeOffNote = '';
    if (show.id === baseShow.id) {
      tradeOffNote = 'Currently selected show';
    } else {
      const timeNote =
        diffMinutes === 0
          ? 'Same showtime'
          : diffMinutes > 0
          ? `${diffMinutes}m later`
          : `${Math.abs(diffMinutes)}m earlier`;

      const formatNote = show.format !== baseShow.format ? `${show.format} screen` : '';
      const notes = [timeNote, formatNote].filter(Boolean);
      tradeOffNote = notes.join(' • ');
    }

    const isCheaper = diff < 0;
    const isSamePrice = diff === 0;
    const formattedDiff = isCheaper
      ? `Save ₹${Math.abs(Math.round(diff / 100))}`
      : diff > 0
      ? `+₹${Math.round(diff / 100)}`
      : 'Same price';

    return {
      show,
      breakdown,
      diffFromBasePaise: diff,
      formattedDiff,
      isCheaper,
      isSamePrice,
      savingsPaise: isCheaper ? Math.abs(diff) : 0,
      tradeOffNote,
      isLowestCost: false,
    };
  });

  const minTotal = Math.min(...calculated.map((c) => c.breakdown.totalPaise));

  return calculated
    .map((c) => ({
      ...c,
      isLowestCost: c.breakdown.totalPaise === minTotal,
    }))
    .sort((a, b) => a.breakdown.totalPaise - b.breakdown.totalPaise);
}
