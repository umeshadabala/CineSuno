'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Show,
  ShowSeatMapResponse,
  ShowSeat,
  PriceQuote,
  Booking,
} from '@/types';
import { apiClient } from '@/lib/api-client';

interface CheckoutModalProps {
  show: Show;
  seatMap: ShowSeatMapResponse;
  selectedSeats: ShowSeat[];
  quote: PriceQuote;
  onClose: () => void;
  onBookingConfirmed?: (booking: Booking) => void;
}

export function CheckoutModal({
  show,
  seatMap,
  selectedSeats,
  quote,
  onClose,
  onBookingConfirmed,
}: CheckoutModalProps) {
  const { movie, cinema } = seatMap;

  // Customer form inputs
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'DEMO'>('UPI');

  // Checkout states: 'review' -> 'processing' -> 'confirmed' | 'error'
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'processing' | 'confirmed' | 'error'>('review');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const posterSrc = movie.poster.replace(/\.jpe?g$/i, '.svg');

  // Format date and time
  const formattedShowDate = (() => {
    try {
      const d = new Date(show.startTime);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return show.startTime;
    }
  })();

  const formattedShowTime = (() => {
    try {
      const d = new Date(show.startTime);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  })();

  // Handle Demo Payment and Confirmation
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide your name and mobile number for e-ticket delivery.');
      return;
    }

    setCheckoutStep('processing');
    setErrorMessage(null);

    try {
      // Step 1: Create booking hold
      const bookingRes = await apiClient.createBooking({
        quoteId: quote.id,
        showId: show.id,
        seatIds: selectedSeats.map((s) => s.id),
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
        },
      });

      if (!bookingRes.success) {
        setErrorMessage(bookingRes.error.message || 'Unable to hold selected seats.');
        setCheckoutStep('error');
        return;
      }

      const initialBooking = bookingRes.data;

      // Simulate network latency for payment gateway interaction
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Step 2: Transition to confirmed state
      const confirmed: Booking = {
        ...initialBooking,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        paymentTimestamp: new Date().toISOString(),
        movieTitle: movie.title,
        cinemaName: cinema.name,
        startTime: show.startTime,
      };

      setConfirmedBooking(confirmed);
      setCheckoutStep('confirmed');
      if (onBookingConfirmed) onBookingConfirmed(confirmed);
    } catch {
      setErrorMessage('Payment simulation failed. Please try again.');
      setCheckoutStep('error');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={checkoutStep === 'processing' ? undefined : onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-rose-950/40">
        {/* Close Button */}
        {checkoutStep !== 'processing' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="absolute right-5 top-5 rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* ---------------- CONFIRMED TICKET STATE ---------------- */}
        {checkoutStep === 'confirmed' && confirmedBooking ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              Demo Booking Confirmed
            </span>

            <h2 id="checkout-dialog-title" className="mt-2 text-2xl font-black text-white">
              You&apos;re Going to the Movies!
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Booking Ref: <span className="font-mono font-bold text-rose-400">{confirmedBooking.reference}</span>
            </p>

            {/* Electronic Ticket Card */}
            <div className="mt-6 w-full rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 p-5 text-left relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl" />

              <div className="flex gap-4">
                <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-950">
                  <Image
                    src={posterSrc}
                    alt={movie.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-white">{movie.title}</h3>
                  <p className="text-xs font-medium text-zinc-300 mt-0.5">{cinema.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {formattedShowDate} • {formattedShowTime}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {show.screenName || 'Screen 1'} • {show.format || '2D'} • {show.language}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-semibold">Seats:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSeats.map((s) => (
                        <span
                          key={s.id}
                          className="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-black text-rose-300 border border-rose-500/30"
                        >
                          {s.id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Stub Divider */}
              <div className="my-4 border-t border-dashed border-zinc-800 relative">
                <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-zinc-950" />
                <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-zinc-950" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500 block">Customer</span>
                  <span className="font-bold text-zinc-200">{confirmedBooking.customer?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block">Total Paid (Demo)</span>
                  <span className="font-extrabold text-white text-sm">
                    ₹{Math.round(confirmedBooking.totalPaise / 100)}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-zinc-500 leading-relaxed max-w-sm">
              ⚡ CineSuno Bolna Buildathon Prototype: Simulated payment has succeeded and seats have been marked confirmed in the demo store.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-zinc-800 px-6 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition"
            >
              Done / Return to Movies
            </button>
          </div>
        ) : (
          /* ---------------- ORDER REVIEW & CHECKOUT FORM ---------------- */
          <form onSubmit={handleConfirmPayment} className="flex flex-col gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Step 2 of 2: Checkout & Review
              </span>
              <h2 id="checkout-dialog-title" className="text-2xl font-black text-white mt-1">
                Order Summary
              </h2>
              <p className="text-xs text-zinc-400">
                Verify your showtime details and complete your simulated reservation.
              </p>
            </div>

            {/* Movie & Show Preview Card */}
            <div className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-950">
                <Image
                  src={posterSrc}
                  alt={movie.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-white">{movie.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{cinema.name}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  📅 {formattedShowDate} • ⏰ {formattedShowTime}
                </p>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                    {show.format || '2D'}
                  </span>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {show.language}
                  </span>
                  <span className="text-xs font-semibold text-rose-400 ml-1">
                    Seats: {selectedSeats.map((s) => s.id).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information Input */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Ticket Delivery Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customer-name" className="block text-xs font-medium text-zinc-400 mb-1">
                    Your Name *
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="customer-phone" className="block text-xs font-medium text-zinc-400 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Payment Simulation Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'CARD', 'DEMO'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                      paymentMethod === method
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-md shadow-rose-950/30'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {method === 'UPI' ? '⚡ UPI Instant' : method === 'CARD' ? '💳 Credit/Debit' : '🧪 Demo Token'}
                  </button>
                ))}
              </div>
            </div>

            {/* Itemized Price Breakdown */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Tickets ({selectedSeats.length} seats)</span>
                <span className="font-semibold text-zinc-200">
                  ₹{Math.round(quote.subtotalPaise / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>
                  Convenience Fee (₹5/ticket, capped at ₹30 max)
                </span>
                <span className="font-semibold text-zinc-200">
                  ₹{Math.round(quote.convenienceFeePaise / 100)}
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-white">Total Amount</span>
                <span className="text-lg font-black text-white">
                  ₹{Math.round(quote.totalPaise / 100)}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            {/* Disclaimer banner */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-zinc-500 leading-relaxed">
              💡 Prototype Reality: No real credit card or bank credentials will be charged. Clicking below verifies contract handling and places your demo booking in the authoritative in-memory store.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={checkoutStep === 'processing'}
                className="w-1/3 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Modify Seats
              </button>

              <button
                type="submit"
                disabled={checkoutStep === 'processing'}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 py-3 text-sm font-bold text-white shadow-xl shadow-rose-600/30 hover:from-rose-500 hover:to-amber-400 transition disabled:opacity-50"
              >
                {checkoutStep === 'processing' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Simulating Confirmation...
                  </>
                ) : (
                  <>Pay ₹{Math.round(quote.totalPaise / 100)} & Confirm (Demo)</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
