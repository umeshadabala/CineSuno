import type { SeatCategory } from '@/types';

/**
 * Convenience fee rule:
 * Exactly ₹5 (500 paise) per ticket, strictly capped at ₹30 (3000 paise) per booking transaction.
 */
export const CONVENIENCE_FEE_PER_TICKET_PAISE = 500;
export const MAX_CONVENIENCE_FEE_PAISE = 3000;
export const MAX_TICKETS_PER_BOOKING = 20;

/**
 * Tier offsets relative to the show's base price in integer Indian paise:
 * - standard: base ticket price
 * - premium: base + ₹30 (3000 paise)
 * - recliner: base + ₹80 (8000 paise)
 */
export const TIER_SURCHARGES_PAISE: Record<SeatCategory, number> = {
  standard: 0,
  premium: 3000,
  recliner: 8000,
};

/**
 * Calculates the individual seat price in integer paise based on the show's base price and seat category.
 */
export function calculateSeatPricePaise(basePricePaise: number, category: SeatCategory): number {
  const surcharge = TIER_SURCHARGES_PAISE[category] ?? 0;
  return basePricePaise + surcharge;
}

/**
 * Calculates the convenience fee in integer paise for a given ticket count.
 * Fee = min(count * 500, 3000)
 */
export function calculateConvenienceFeePaise(ticketCount: number): number {
  if (ticketCount <= 0) return 0;
  return Math.min(ticketCount * CONVENIENCE_FEE_PER_TICKET_PAISE, MAX_CONVENIENCE_FEE_PAISE);
}

/**
 * Calculates the complete pricing breakdown for an array of seat prices in integer paise.
 */
export function calculatePricingBreakdown(seatPricesPaise: number[]): {
  ticketCount: number;
  subtotalPaise: number;
  convenienceFeePaise: number;
  totalPaise: number;
} {
  const ticketCount = seatPricesPaise.length;
  const subtotalPaise = seatPricesPaise.reduce((sum, price) => sum + price, 0);
  const convenienceFeePaise = calculateConvenienceFeePaise(ticketCount);
  const totalPaise = subtotalPaise + convenienceFeePaise;

  return {
    ticketCount,
    subtotalPaise,
    convenienceFeePaise,
    totalPaise,
  };
}
