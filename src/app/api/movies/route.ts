import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/movie-search';
import {
  createErrorResponse,
  createSuccessResponse,
  validateMovieSearchParams,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const validation = validateMovieSearchParams(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(
          validation.error.code,
          validation.error.message,
          validation.error.field
        ),
        { status: 400 }
      );
    }

    const movies = searchMovies(validation.data);
    return NextResponse.json(createSuccessResponse(movies), { status: 200 });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error handling GET /api/movies:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred while retrieving movies.'),
      { status: 500 }
    );
  }
}
