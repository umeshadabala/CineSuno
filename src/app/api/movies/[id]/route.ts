import { NextRequest, NextResponse } from 'next/server';
import { getMovieById } from '@/lib/data-store';
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim() === '') {
      return NextResponse.json(
        createErrorResponse('INVALID_INPUT', 'Movie ID is required.', 'id'),
        { status: 400 }
      );
    }

    const movie = getMovieById(id.trim());

    if (!movie) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', `Movie with ID '${id}' not found.`, 'id'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(movie), { status: 200 });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error handling GET /api/movies/[id]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred while retrieving the movie.'),
      { status: 500 }
    );
  }
}
