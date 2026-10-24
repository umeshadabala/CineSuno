import { NextRequest, NextResponse } from 'next/server';
import { getShowSeatMapResponse } from '@/lib/booking-state';
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim() === '') {
      return NextResponse.json(
        createErrorResponse('INVALID_INPUT', 'Show ID is required.', 'id'),
        { status: 400 }
      );
    }

    const seatMap = getShowSeatMapResponse(id.trim());

    if (!seatMap) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', `Show with ID '${id}' not found.`, 'id'),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(seatMap), { status: 200 });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error handling GET /api/shows/[id]/seats:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred while retrieving show seats.'),
      { status: 500 }
    );
  }
}
