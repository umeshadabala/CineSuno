import { Movie, Show } from '@/types';

export interface UserPreferences {
  languages: string[];
  genres: string[];
  preferredTimeOfDay?: 'any' | 'morning' | 'afternoon' | 'evening' | 'night';
  preferredSeating?: 'standard' | 'premium' | 'recliner';
  maxBudgetPerTicketPaise?: number; // integer paise, e.g. 25000 = ₹250
  accessibilityNeed?: 'none' | 'wheelchair' | 'companion';
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  languages: ['Hindi', 'Telugu'],
  genres: ['Action', 'Sci-Fi'],
  preferredTimeOfDay: 'evening',
  preferredSeating: 'premium',
  maxBudgetPerTicketPaise: undefined,
  accessibilityNeed: 'none',
};

export const PREFERENCES_PRIVACY_DISCLOSURE =
  'Preferences are stored strictly in your local browser storage. They are never transmitted to external services, sold, or synced across devices.';

const STORAGE_KEY = 'cinesuno_user_preferences';

export function getStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      languages: Array.isArray(parsed.languages) ? parsed.languages : DEFAULT_PREFERENCES.languages,
      genres: Array.isArray(parsed.genres) ? parsed.genres : DEFAULT_PREFERENCES.genres,
      preferredTimeOfDay: parsed.preferredTimeOfDay || DEFAULT_PREFERENCES.preferredTimeOfDay,
      preferredSeating: parsed.preferredSeating || DEFAULT_PREFERENCES.preferredSeating,
      maxBudgetPerTicketPaise: typeof parsed.maxBudgetPerTicketPaise === 'number' ? parsed.maxBudgetPerTicketPaise : undefined,
      accessibilityNeed: parsed.accessibilityNeed || 'none',
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors in restricted private contexts
  }
}

export function resetPreferences(): UserPreferences {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return DEFAULT_PREFERENCES;
}

export interface RecommendedMovie {
  movie: Movie;
  score: number;
  explanation: string;
}

/**
 * Deterministically ranks movies based on the user's explicit preferences.
 * Produces transparent, human-readable explanations.
 */
export function rankMoviesByPreferences(
  movies: Movie[],
  prefs: UserPreferences
): RecommendedMovie[] {
  return movies
    .map((movie) => {
      let score = 0;
      const reasons: string[] = [];

      // Language match (+40 pts per matching language)
      const matchingLangs = movie.languages.filter((l) => prefs.languages.includes(l));
      if (matchingLangs.length > 0) {
        score += 40;
        reasons.push(`available in ${matchingLangs.join(', ')}`);
      }

      // Genre match (+35 pts per matching genre)
      const matchingGenres = movie.genres.filter((g) => prefs.genres.includes(g));
      if (matchingGenres.length > 0) {
        score += 35;
        reasons.push(`matches ${matchingGenres.join(' & ')} genre preference`);
      }

      // Rating boost
      if (movie.rating) {
        score += Math.round(movie.rating * 2.5); // Up to 25 pts
      }

      // Status check (now_showing has immediate utility)
      if (movie.status === 'now_showing') {
        score += 10;
      }

      const explanation = reasons.length > 0
        ? `Recommended because it is ${reasons.join(' and ')}.`
        : `Popular title with rating ${movie.rating || 8.0}/10.`;

      return {
        movie,
        score,
        explanation,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Filter and sort showtimes matching preferred time of day.
 */
export function filterShowsByTimePreference(
  shows: Show[],
  timePref?: UserPreferences['preferredTimeOfDay']
): Show[] {
  if (!timePref || timePref === 'any') return shows;

  return shows.filter((show) => {
    const date = new Date(show.startTime);
    const hours = date.getHours();

    switch (timePref) {
      case 'morning':
        return hours >= 6 && hours < 12;
      case 'afternoon':
        return hours >= 12 && hours < 17;
      case 'evening':
        return hours >= 17 && hours < 21;
      case 'night':
        return hours >= 21 || hours < 2;
      default:
        return true;
    }
  });
}
