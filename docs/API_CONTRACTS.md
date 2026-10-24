# CineSuno — Shared API Contracts & Data Specifications

This document defines the authoritative HTTP API contracts and domain conventions agreed upon by **Developer A (Frontend Lead)** and **Developer B (Backend Lead)** for CineSuno.

All types referenced in this specification are defined in [src/types/index.ts]

---

## 1. Core Architectural Conventions

1. **Consistent Response Envelope**:
   - Every API endpoint returns a standard JSON envelope: `ApiResponse<T>`.
   - **Success (`200 OK`, `201 Created`)**:
     ```json
     {
       "success": true,
       "data": { ... },
       "message": "Optional descriptive message"
     }
     ```
   - **Failure (`400`, `404`, `409`, `422`, `500`)**:
     ```json
     {
       "success": false,
       "error": {
         "code": "ERROR_CODE_STRING",
         "message": "Safe human-readable explanation",
         "field": "optionalField"
       }
     }
     ```
   - Raw stack traces, SQL errors, database credentials, and internal filesystem paths are never returned in error responses.

2. **Integer Paise for All Currency Values**:
   - Money is strictly calculated, stored, and transmitted as integers representing Indian paise (1 Rupee = 100 paise).
   - Example: ₹250.00 is represented as `25000`.
   - The frontend formats paise to rupees for display purposes only. All mathematical calculations occur on the backend.

3. **Standard Timestamps**:
   - All dates and timestamps are formatted as ISO 8601 strings including timezone offset (e.g., `2026-10-25T18:30:00+05:30`).

4. **Authoritative Backend Pricing & Validation**:
   - Client applications and AI voice agents must never calculate prices or decide seat availability independently.
   - The backend recalculates subtotals, fees, and checks seat availability at every state change.

5. **Convenience Fee Rule**:
   - Exactly ₹5 (500 paise) per ticket, strictly capped at a maximum of ₹30 (3000 paise) per booking:
     $$\text{convenienceFeePaise} = \min(\text{ticketCount} \times 500, 3000)$$

6. **Ticket Count Limits**:
   - Minimum: 1 ticket. Maximum: 20 tickets per booking transaction.
   - Zero, negative, fractional, or counts greater than 20 are rejected immediately with `INVALID_TICKET_COUNT` (`400 Bad Request`).

7. **Show-Dependent Seat Availability**:
   - Physical seats in a hall are fixed fixtures (`Seat`).
   - Seat availability (`ShowSeatAvailability`) belongs strictly to an individual showtime (`Show`). A seat booked for one show remains available for other shows.

8. **Two-Step Booking Lifecycle (Hold vs. Confirm)**:
   - Creating a booking places a temporary hold on the selected seats.
   - A booking is never marked `confirmed` until the simulated payment endpoint (`/confirm-demo`) has succeeded.

9. **Unified Voice and Web Engine**:
   - Bolna voice tool handlers invoke the exact same server-side domain functions as HTTP routes. There is no separate pricing or booking bypass for voice interactions.

10. **Prototype Reality**:
    - Mock catalogue data is fictional and stored in local JSON fixtures.
    - Demo bookings and payment simulations are ephemeral and do not represent real cinema admissions or banking transactions.

---

## 2. API Endpoint Specifications

### 2.1 GET `/api/movies`
Retrieve a list of movies with optional filters.

- **Method**: `GET`
- **Query Parameters**:
  - `query` (optional, string): Case-insensitive search on title or synopsis.
  - `language` (optional, string): Filter by language (e.g. `Hindi`, `English`, `Telugu`).
  - `genre` (optional, string): Filter by genre (e.g. `Action`, `Drama`, `Sci-Fi`).
  - `status` (optional, string): Filter by release status (`now_showing`, `coming_soon`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "mov-01",
        "title": "Kalki 2898 AD",
        "languages": ["Telugu", "Hindi", "Tamil"],
        "genres": ["Action", "Sci-Fi"],
        "runtimeMinutes": 180,
        "certificate": "UA",
        "synopsis": "A modern avatar of Vishnu descends to earth to protect the world from evil forces.",
        "poster": "/posters/kalki.jpg",
        "status": "now_showing",
        "rating": 8.4
      }
    ]
  }
  ```
- **Error Codes**: `500 INTERNAL_ERROR`

---

### 2.2 GET `/api/movies/[id]`
Retrieve complete details for a single movie.

- **Method**: `GET`
- **Route Parameters**:
  - `id` (required, string): Unique movie ID (e.g., `mov-01`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "mov-01",
      "title": "Kalki 2898 AD",
      "languages": ["Telugu", "Hindi", "Tamil"],
      "genres": ["Action", "Sci-Fi"],
      "runtimeMinutes": 180,
      "certificate": "UA",
      "synopsis": "A modern avatar of Vishnu descends to earth to protect the world from evil forces.",
      "poster": "/posters/kalki.jpg",
      "status": "now_showing",
      "rating": 8.4
    }
  }
  ```
- **Error Codes**:
  - `404 NOT_FOUND`: Movie with specified ID does not exist.

---

### 2.3 GET `/api/shows`
Retrieve available showtimes matching search criteria.

- **Method**: `GET`
- **Query Parameters**:
  - `movieId` (optional, string): Filter shows by movie ID.
  - `cinemaId` (optional, string): Filter shows by cinema ID.
  - `date` (optional, string): Date string in `YYYY-MM-DD` format.
  - `city` (optional, string): Filter by cinema city (e.g. `Bengaluru`, `Mumbai`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "show-101",
        "movieId": "mov-01",
        "cinemaId": "cin-01",
        "startTime": "2026-10-25T18:30:00+05:30",
        "ticketPricePaise": 25000,
        "status": "scheduled",
        "screenName": "Screen 1",
        "format": "IMAX 2D",
        "language": "Hindi"
      }
    ]
  }
  ```
- **Error Codes**:
  - `400 INVALID_INPUT`: Invalid date format or parameters.

---

### 2.4 GET `/api/shows/[id]/seats`
Retrieve the complete seat map and real-time availability for a specific showtime.

- **Method**: `GET`
- **Route Parameters**:
  - `id` (required, string): Showtime ID (e.g. `show-101`).
- **Success Response (`200 OK`)**:
  - Envelope payload type: `ApiResponse<ShowSeatMapResponse>`
  ```json
  {
    "success": true,
    "data": {
      "showId": "show-101",
      "movie": { "id": "mov-01", "title": "Kalki 2898 AD" },
      "cinema": { "id": "cin-01", "name": "PVR Forum Mall", "city": "Bengaluru" },
      "show": {
        "id": "show-101",
        "startTime": "2026-10-25T18:30:00+05:30",
        "ticketPricePaise": 25000
      },
      "totalSeats": 60,
      "availableSeats": 42,
      "seats": [
        {
          "id": "E5",
          "cinemaId": "cin-01",
          "row": "E",
          "number": 5,
          "zone": "middle",
          "category": "premium",
          "viewScore": 95,
          "aisle": false,
          "showId": "show-101",
          "status": "available",
          "pricePaise": 28000
        }
      ]
    }
  }
  ```
- **Error Codes**:
  - `404 NOT_FOUND`: Show ID does not exist.

---

### 2.5 POST `/api/seats/recommend`
Deterministically compute the best available seats for a show given requested criteria.

- **Method**: `POST`
- **Request Body** (`SeatRecommendationRequest`):
  ```json
  {
    "showId": "show-101",
    "seatCount": 2,
    "adjacentSeatsOnly": true,
    "preferredZone": "middle",
    "preferredCategory": "premium",
    "maxBudgetPaise": 70000
  }
  ```
- **Business Rules**:
  - `seatCount` must be an integer between 1 and 20.
  - Scores are heuristic rankings based on view angle and center alignment, not scientifically certified metrics.
- **Success Response (`200 OK`)**:
  - Envelope payload type: `ApiResponse<SeatRecommendationResult>`
  ```json
  {
    "success": true,
    "data": {
      "showId": "show-101",
      "recommendedSeatIds": ["E5", "E6"],
      "score": 94,
      "explanation": "2 adjacent premium seats in the middle zone with optimal center screen view.",
      "totalPricePaise": 56000,
      "seats": [
        {
          "id": "E5",
          "row": "E",
          "number": 5,
          "zone": "middle",
          "category": "premium",
          "pricePaise": 28000,
          "status": "available"
        },
        {
          "id": "E6",
          "row": "E",
          "number": 6,
          "zone": "middle",
          "category": "premium",
          "pricePaise": 28000,
          "status": "available"
        }
      ]
    }
  }
  ```
- **Error Codes**:
  - `400 INVALID_TICKET_COUNT`: Count not in 1–20 range.
  - `404 NOT_FOUND`: Show does not exist.
  - `409 SEAT_UNAVAILABLE`: Cannot satisfy constraints (e.g. adjacent seats unavailable).

---

### 2.6 POST `/api/quotes`
Generate a validated price quote for requested seats. The quote locks pricing for a limited window.

- **Method**: `POST`
- **Request Body** (`CreateQuoteRequest`):
  ```json
  {
    "showId": "show-101",
    "seatIds": ["E5", "E6"]
  }
  ```
- **Business Rules**:
  - Validates that `seatIds` has length 1–20 and contains no duplicate IDs.
  - Verifies that all requested seats are currently `available`.
  - Calculates subtotal from server-side tier pricing.
  - Calculates convenience fee: `Math.min(seatIds.length * 500, 3000)`.
- **Success Response (`201 Created`)**:
  - Envelope payload type: `ApiResponse<PriceQuote>`
  ```json
  {
    "success": true,
    "data": {
      "id": "qte-98124",
      "showId": "show-101",
      "seatIds": ["E5", "E6"],
      "ticketCount": 2,
      "subtotalPaise": 56000,
      "convenienceFeePaise": 1000,
      "additionalCharges": [],
      "totalPaise": 57000,
      "createdAt": "2026-10-25T14:00:00+05:30",
      "expiresAt": "2026-10-25T14:10:00+05:30",
      "status": "active"
    }
  }
  ```
- **Error Codes**:
  - `400 INVALID_TICKET_COUNT`: Empty list or >20 seats.
  - `400 SEAT_DUPLICATE`: Duplicate seat IDs submitted.
  - `404 NOT_FOUND`: Show ID or Seat IDs do not exist.
  - `409 SEAT_UNAVAILABLE`: One or more seats already held or booked.

---

### 2.7 POST `/api/bookings`
Create a booking hold from a valid, active price quote.

- **Method**: `POST`
- **Request Body** (`CreateBookingRequest`):
  ```json
  {
    "quoteId": "qte-98124",
    "showId": "show-101",
    "seatIds": ["E5", "E6"],
    "customer": {
      "name": "Jane Doe",
      "phone": "+919876543210"
    }
  }
  ```
- **Business Rules**:
  - Quote must be active and not expired (`now <= expiresAt`).
  - Seats must still be available (or already held for this quote).
  - Puts seats in `held` state and creates booking in `pending_demo_payment` status.
- **Success Response (`201 Created`)**:
  - Envelope payload type: `ApiResponse<Booking>`
  ```json
  {
    "success": true,
    "data": {
      "id": "bkg-4412",
      "reference": "CS-9812-F4",
      "showId": "show-101",
      "seatIds": ["E5", "E6"],
      "quoteId": "qte-98124",
      "ticketCount": 2,
      "totalPaise": 57000,
      "status": "pending_demo_payment",
      "createdAt": "2026-10-25T14:02:00+05:30",
      "customer": {
        "name": "Jane Doe",
        "phone": "+919876543210"
      }
    }
  }
  ```
- **Error Codes**:
  - `400 QUOTE_EXPIRED`: The provided quote has expired.
  - `400 QUOTE_INVALID`: Submitted seats do not match quote.
  - `409 SEAT_UNAVAILABLE`: Seats were booked before hold was placed.

---

### 2.8 GET `/api/bookings/[id]`
Retrieve current details and status of a booking by its ID or reference.

- **Method**: `GET`
- **Route Parameters**:
  - `id` (required, string): Booking ID (e.g. `bkg-4412`) or reference code.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "bkg-4412",
      "reference": "CS-9812-F4",
      "showId": "show-101",
      "seatIds": ["E5", "E6"],
      "quoteId": "qte-98124",
      "ticketCount": 2,
      "totalPaise": 57000,
      "status": "confirmed",
      "createdAt": "2026-10-25T14:02:00+05:30",
      "confirmedAt": "2026-10-25T14:03:15+05:30",
      "customer": {
        "name": "Jane Doe",
        "phone": "+919876543210"
      }
    }
  }
  ```
- **Error Codes**:
  - `404 BOOKING_NOT_FOUND`: Booking not found.

---

### 2.9 POST `/api/bookings/[id]/confirm-demo`
Simulate mock payment completion and transition booking to `confirmed` status.

- **Method**: `POST`
- **Route Parameters**:
  - `id` (required, string): Booking ID to confirm.
- **Request Body** (`ConfirmDemoPaymentRequest`):
  ```json
  {
    "bookingId": "bkg-4412",
    "paymentMethod": "UPI"
  }
  ```
- **Business Rules**:
  - Target booking must be in `pending_demo_payment` or `pending_confirmation` status.
  - If booking has expired or failed, payment is rejected.
  - On success, transitions booking status to `confirmed` and permanently marks associated show seats as `booked`.
- **Success Response (`200 OK`)**:
  - Envelope payload type: `ApiResponse<ConfirmDemoPaymentResponse>`
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "bkg-4412",
      "reference": "CS-9812-F4",
      "status": "confirmed",
      "paymentReference": "DEMO-PAY-77192",
      "confirmedAt": "2026-10-25T14:03:15+05:30",
      "booking": {
        "id": "bkg-4412",
        "reference": "CS-9812-F4",
        "showId": "show-101",
        "seatIds": ["E5", "E6"],
        "quoteId": "qte-98124",
        "ticketCount": 2,
        "totalPaise": 57000,
        "status": "confirmed",
        "createdAt": "2026-10-25T14:02:00+05:30",
        "confirmedAt": "2026-10-25T14:03:15+05:30"
      }
    }
  }
  ```
- **Error Codes**:
  - `400 BOOKING_INVALID_STATE`: Booking is already confirmed, cancelled, or in invalid state.
  - `400 BOOKING_EXPIRED`: Booking hold window expired.
  - `404 BOOKING_NOT_FOUND`: Booking ID not found.

---

## 3. Bolna Voice Integration Parity

The Bolna voice agent tools interact with the CineSuno backend using these exact contracts:

| Voice Tool Name | Underlying API Domain Logic |
| :--- | :--- |
| `search_movies` | Same filtering as `GET /api/movies` |
| `get_showtimes` | Same filtering as `GET /api/shows` |
| `get_seat_map` | Same seat availability as `GET /api/shows/[id]/seats` |
| `recommend_seats` | Same deterministic algorithm as `POST /api/seats/recommend` |
| `create_quote` | Same calculation as `POST /api/quotes` |
| `reserve_seats` | Same hold creation as `POST /api/bookings` |
| `confirm_booking` | Same confirmation flow as `POST /api/bookings/[id]/confirm-demo` |

The voice agent executes the exact same underlying service logic as web clients, ensuring 100% price and availability parity.
