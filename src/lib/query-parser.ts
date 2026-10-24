import { MovieStatus } from '@/types';

export interface ParsedMovieQuery {
  rawQuery: string;
  movieTitle?: string;
  language?: string;
  genre?: string;
  status?: MovieStatus;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  minTimeHour?: number; // e.g. after 7 PM -> 19
  partySize?: number; // e.g. for 3 people -> 3
  isAmbiguous?: boolean;
  clarificationMessage?: string;
  extractedChips: Array<{ label: string; value: string; type: 'movie' | 'language' | 'genre' | 'time' | 'party' }>;
}

const KNOWN_LANGUAGES = ['Hindi', 'Telugu', 'Tamil', 'English', 'Kannada', 'Malayalam'];
const KNOWN_GENRES = ['Action', 'Sci-Fi', 'Comedy', 'Horror', 'Drama', 'Crime', 'Thriller', 'Adventure'];

// Known movies from the catalogue for deterministic matching
const KNOWN_TITLES: Array<{ title: string; aliases: string[] }> = [
  { title: 'Kalki 2898 AD', aliases: ['kalki', 'kalki 2898', 'prabhas movie'] },
  { title: 'Stree 2', aliases: ['stree', 'stree 2', 'sarkata'] },
  { title: 'Pushpa 2: The Rule', aliases: ['pushpa', 'pushpa 2', 'pushpa the rule'] },
  { title: 'Interstellar (IMAX Re-Release)', aliases: ['interstellar', 'imax interstellar', 'nolan movie'] },
  { title: 'Devara: Part 1', aliases: ['devara', 'devara part 1', 'ntr movie'] },
  { title: 'Toxic: A Fairy Tale for Grown-ups', aliases: ['toxic', 'yash movie'] },
  { title: 'War 2', aliases: ['war', 'war 2', 'hrithik movie'] },
];

/**
 * Deterministic natural-language parser for movie search queries.
 * Extracts intent without external LLM hallucination.
 */
export function parseNaturalLanguageQuery(query: string): ParsedMovieQuery {
  const rawQuery = query.trim();
  if (!rawQuery) {
    return {
      rawQuery: '',
      extractedChips: [],
    };
  }

  const qLower = rawQuery.toLowerCase();
  const chips: ParsedMovieQuery['extractedChips'] = [];

  let matchedMovieTitle: string | undefined;
  let matchedLanguage: string | undefined;
  let matchedGenre: string | undefined;
  let matchedTimeOfDay: ParsedMovieQuery['timeOfDay'];
  let minTimeHour: number | undefined;
  let partySize: number | undefined;

  // 1. Match Movie Title
  for (const item of KNOWN_TITLES) {
    for (const alias of item.aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(qLower)) {
        matchedMovieTitle = item.title;
        chips.push({ label: 'Movie', value: item.title, type: 'movie' });
        break;
      }
    }
    if (matchedMovieTitle) break;
  }

  // 2. Match Language
  for (const lang of KNOWN_LANGUAGES) {
    const regex = new RegExp(`\\b${lang.toLowerCase()}\\b`, 'i');
    if (regex.test(qLower)) {
      matchedLanguage = lang;
      chips.push({ label: 'Language', value: lang, type: 'language' });
      break;
    }
  }

  // 3. Match Genre or semantic keywords (e.g. "family" -> Comedy/Adventure/Sci-Fi)
  if (/\b(family|kids|family outing)\b/i.test(qLower)) {
    matchedGenre = 'Comedy';
    chips.push({ label: 'Genre', value: 'Family / Comedy', type: 'genre' });
  } else {
    for (const genre of KNOWN_GENRES) {
      const regex = new RegExp(`\\b${genre.toLowerCase()}\\b`, 'i');
      if (regex.test(qLower)) {
        matchedGenre = genre;
        chips.push({ label: 'Genre', value: genre, type: 'genre' });
        break;
      }
    }
  }

  // 4. Match Time Intent (e.g., "tonight", "after 7 PM", "evening", "morning")
  const hourMatch = qLower.match(/after\s+(\d{1,2})\s*(pm|am)?/i);
  if (hourMatch) {
    let hour = parseInt(hourMatch[1], 10);
    const isPm = hourMatch[2]?.toLowerCase() === 'pm' || (hour < 12 && !hourMatch[2] && hour >= 1 && hour <= 11);
    if (isPm && hour < 12) hour += 12;
    minTimeHour = hour;
    matchedTimeOfDay = hour >= 18 ? 'evening' : 'afternoon';
    chips.push({ label: 'Time', value: `After ${hourMatch[1]} ${hourMatch[2] || 'PM'}`, type: 'time' });
  } else if (/\b(tonight|night|late night)\b/i.test(qLower)) {
    matchedTimeOfDay = 'night';
    minTimeHour = 20; // 8 PM onwards
    chips.push({ label: 'Time', value: 'Tonight (after 8 PM)', type: 'time' });
  } else if (/\b(evening)\b/i.test(qLower)) {
    matchedTimeOfDay = 'evening';
    minTimeHour = 17; // 5 PM onwards
    chips.push({ label: 'Time', value: 'Evening (5-9 PM)', type: 'time' });
  } else if (/\b(afternoon)\b/i.test(qLower)) {
    matchedTimeOfDay = 'afternoon';
    chips.push({ label: 'Time', value: 'Afternoon (12-4 PM)', type: 'time' });
  } else if (/\b(morning)\b/i.test(qLower)) {
    matchedTimeOfDay = 'morning';
    chips.push({ label: 'Time', value: 'Morning', type: 'time' });
  }

  // 5. Match Party Size (e.g., "for 3 people", "3 tickets", "two seats", "couple")
  const partyMatch = qLower.match(/\b(?:for\s+)?(\d{1,2})\s*(?:people|tickets|seats|person|friends)?\b/i);
  if (partyMatch && parseInt(partyMatch[1], 10) > 0 && parseInt(partyMatch[1], 10) <= 20) {
    partySize = parseInt(partyMatch[1], 10);
    chips.push({ label: 'Party', value: `${partySize} ${partySize === 1 ? 'ticket' : 'tickets'}`, type: 'party' });
  } else if (/\b(two|couple|both of us)\b/i.test(qLower)) {
    partySize = 2;
    chips.push({ label: 'Party', value: '2 tickets', type: 'party' });
  } else if (/\b(three)\b/i.test(qLower)) {
    partySize = 3;
    chips.push({ label: 'Party', value: '3 tickets', type: 'party' });
  } else if (/\b(four)\b/i.test(qLower)) {
    partySize = 4;
    chips.push({ label: 'Party', value: '4 tickets', type: 'party' });
  }

  // 6. Check for ambiguity / unsupported queries
  let isAmbiguous = false;
  let clarificationMessage: string | undefined;

  // If user typed words but none matched our catalog criteria or general intents
  if (chips.length === 0 && rawQuery.split(' ').length > 2) {
    isAmbiguous = true;
    clarificationMessage = `We couldn't clearly match "${rawQuery}". Try specifying a movie title (like Kalki or Stree 2), language (Telugu, Hindi), or time (e.g. "Action movies tonight").`;
  }

  return {
    rawQuery,
    movieTitle: matchedMovieTitle,
    language: matchedLanguage,
    genre: matchedGenre,
    timeOfDay: matchedTimeOfDay,
    minTimeHour,
    partySize,
    isAmbiguous,
    clarificationMessage,
    extractedChips: chips,
  };
}
