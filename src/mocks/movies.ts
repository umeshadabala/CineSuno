import { Movie } from '@/types';

/**
 * Mock movie fixtures for frontend development.
 * Complies strictly with the shared Movie contract in `src/types/index.ts`.
 */
export const MOCK_MOVIES: Movie[] = [
  {
    id: 'mov-01',
    title: 'Kalki 2898 AD',
    languages: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
    genres: ['Action', 'Sci-Fi', 'Mythology'],
    runtimeMinutes: 180,
    certificate: 'UA',
    synopsis:
      'Set in a post-apocalyptic world in the year 2898 AD, a modern avatar of Vishnu descends to earth to protect the world from evil forces and herald a new golden era.',
    poster: '/posters/kalki.svg',
    status: 'now_showing',
    releaseDate: '2026-06-27',
    rating: 8.6,
  },
  {
    id: 'mov-02',
    title: 'Jawan: Extended Cut',
    languages: ['Hindi', 'Tamil', 'Telugu'],
    genres: ['Action', 'Thriller', 'Drama'],
    runtimeMinutes: 171,
    certificate: 'UA',
    synopsis:
      'A prison warden orchestrates daring heists and vigilante justice to uncover systemic corruption, driven by a deep personal vendetta and a promise made years ago.',
    poster: '/posters/jawan.svg',
    status: 'now_showing',
    releaseDate: '2026-09-07',
    rating: 8.2,
  },
  {
    id: 'mov-03',
    title: 'Stree 2',
    languages: ['Hindi'],
    genres: ['Comedy', 'Horror'],
    runtimeMinutes: 147,
    certificate: 'UA',
    synopsis:
      'The town of Chanderi faces a terrifying new headless entity called Sarkata. Vicky and his eccentric friends must reunite with Stree to save the women of their village.',
    poster: '/posters/stree2.svg',
    status: 'now_showing',
    releaseDate: '2026-08-15',
    rating: 8.1,
  },
  {
    id: 'mov-04',
    title: 'Maharaja',
    languages: ['Tamil', 'Telugu', 'Hindi'],
    genres: ['Thriller', 'Action', 'Drama'],
    runtimeMinutes: 140,
    certificate: 'UA',
    synopsis:
      'A humble barber arrives at a police station reporting the theft of Lakshmi—a steel trash can. As the police investigate, a dark, gripping tale of vengeance unravels.',
    poster: '/posters/maharaja.svg',
    status: 'now_showing',
    releaseDate: '2026-06-14',
    rating: 8.8,
  },
  {
    id: 'mov-05',
    title: 'Kantara: Chapter 1',
    languages: ['Kannada', 'Hindi', 'Telugu', 'Tamil', 'Malayalam'],
    genres: ['Action', 'Mythology', 'Period Drama'],
    runtimeMinutes: 165,
    certificate: 'UA',
    synopsis:
      'The prequel exploring the divine origins of the Bhoota Kola deity and the ancient conflict between royal greed and indigenous forest lore in coastal Karnataka.',
    poster: '/posters/kantara.svg',
    status: 'coming_soon',
    releaseDate: '2026-11-14',
    rating: 9.1,
  },
  {
    id: 'mov-06',
    title: 'Pushpa 2: The Rule',
    languages: ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'],
    genres: ['Action', 'Crime', 'Drama'],
    runtimeMinutes: 178,
    certificate: 'A',
    synopsis:
      'Pushpa Raj expands his red sandalwood syndicate across international waters while his clash with Bhanwar Singh Shekhawat escalates into an all-out war.',
    poster: '/posters/pushpa2.svg',
    status: 'coming_soon',
    releaseDate: '2026-12-06',
    rating: 8.9,
  },
  {
    id: 'mov-07',
    title: 'Aavesham',
    languages: ['Malayalam', 'Hindi', 'Tamil'],
    genres: ['Comedy', 'Action'],
    runtimeMinutes: 158,
    certificate: 'UA',
    synopsis:
      'Three engineering students in Bengaluru run into a local eccentric gangster named Ranga for protection from college bullies, turning their lives into utter chaos.',
    poster: '/posters/aavesham.svg',
    status: 'now_showing',
    releaseDate: '2026-04-11',
    rating: 8.5,
  },
  {
    id: 'mov-08',
    title: 'Manjummel Boys',
    languages: ['Malayalam', 'Tamil', 'Telugu', 'Hindi'],
    genres: ['Adventure', 'Drama', 'Thriller'],
    runtimeMinutes: 135,
    certificate: 'U',
    synopsis:
      'A vacation in Kodaikanal takes a harrowing turn when one friend slips into the treacherous Guna Caves, triggering an extraordinary rescue driven by sheer brotherhood.',
    poster: '/posters/manjummel.svg',
    status: 'now_showing',
    releaseDate: '2026-02-22',
    rating: 8.7,
  },
];
