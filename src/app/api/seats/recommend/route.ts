import { NextRequest, NextResponse } from 'next/server';
import { recommendSeats } from '@/lib/seat-recommender';
import {
  createErrorResponse,
  createSuccessResponse,
  validateSeatRecommendationRequest,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createErrorResponse('INVALID_INPUT', 'Malformed JSON in request body.'),
        { status: 400 }
      );
    }

    const validation = validateSeatRecommendationRequest(body);
    if (!validation.success) {
      const statusCode = validation.error.code === 'INVALID_TICKET_COUNT' ? 400 : 400;
      return NextResponse.json(
        createErrorResponse(
          validation.error.code,
          validation.error.message,
          validation.error.field
        ),
        { status: statusCode }
      );
    }

    const recommendation = recommendSeats(validation.data);

    if (!recommendation.success) {
      const { code, message } = recommendation.error;
      let statusCode = 400;
      if (code === 'NOT_FOUND') {
        statusCode = 404;
      } else if (code === 'SEAT_UNAVAILABLE') {
        statusCode = 409;
      } else if (code === 'INVALID_TICKET_COUNT') {
        statusCode = 400;
      }

      return NextResponse.json(createErrorResponse(code, message), { status: statusCode });
    }

    return NextResponse.json(createSuccessResponse(recommendation.data), { status: 200 });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error handling POST /api/seats/recommend:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred while recommending seats.'),
      { status: 500 }
    );
  }
}
