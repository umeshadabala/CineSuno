import { NextRequest, NextResponse } from 'next/server';
import { searchShows } from '@/lib/movie-search';
import {
  createErrorResponse,
  createSuccessResponse,
  validateShowSearchParams,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const validation = validateShowSearchParams(searchParams);

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

    const shows = searchShows(validation.data);
    return NextResponse.json(createSuccessResponse(shows), { status: 200 });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error handling GET /api/shows:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred while retrieving shows.'),
      { status: 500 }
    );
  }
}
