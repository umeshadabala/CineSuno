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
import { useToast } from '@/lib/toast';
import {
  CheckIcon,
  XIcon,
  CalendarIcon,
  ClockIcon,
  InfoIcon,
} from '@/components/icons';

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
  const toast = useToast();

  // Customer form inputs
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'DEMO'>('UPI');

  // Checkout states: 'review' -> 'processing' -> 'confirmed' | 'error'
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'processing' | 'confirmed' | 'error'>('review');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [posterError, setPosterError] = useState<boolean>(false);

  const posterSrc = posterError ? '/posters/kalki.jpg' : movie.poster;

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
        const msg = bookingRes.error.message || 'Unable to hold selected seats.';
        setErrorMessage(msg);
        setCheckoutStep('error');
        toast.error(msg);
        return;
      }

      const initialBooking = bookingRes.data;

      // Simulate network latency for payment gateway interaction
      await new Promise((resolve) => setTimeout(resolve, 800));

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
      if (typeof window !== 'undefined') {
        try {
          const prev = JSON.parse(localStorage.getItem('cinesuno_bookings') || '[]');
          localStorage.setItem('cinesuno_bookings', JSON.stringify([confirmed, ...prev]));
        } catch {
          // Ignore
        }
      }
      toast.success(`Booking confirmed! Reference: ${confirmed.reference}`);
      if (onBookingConfirmed) onBookingConfirmed(confirmed);
    } catch {
      const msg = 'Payment simulation failed. Please try again.';
      setErrorMessage(msg);
      setCheckoutStep('error');
      toast.error(msg);
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
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-2xl transition-colors">
        {/* Close Button */}
        {checkoutStep !== 'processing' && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="absolute right-5 top-5 rounded-full bg-surface-elevated p-2 text-text-secondary hover:text-text-primary hover:border-brand transition shadow-sm"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}

        {/* ---------------- CONFIRMED TICKET STATE ---------------- */}
        {checkoutStep === 'confirmed' && confirmedBooking ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated text-brand mb-4">
              <CheckIcon className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-selected px-3 py-1 text-xs font-bold text-brand border border-border-subtle">
              Demo Booking Confirmed
            </span>

            <h2 id="checkout-dialog-title" className="mt-2 text-2xl font-black text-text-primary">
              You&apos;re Going to the Movies!
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Booking Ref: <span className="font-mono font-bold text-brand">{confirmedBooking.reference}</span>
            </p>

            {/* Electronic Ticket Card */}
            <div className="mt-6 w-full rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-left relative overflow-hidden shadow-sm">
              <div className="flex gap-4">
                <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl bg-surface border border-border-subtle">
                  <Image
                    src={posterSrc}
                    alt={movie.title}
                    fill
                    unoptimized
                    onError={() => setPosterError(true)}
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-text-primary">{movie.title}</h3>
                  <p className="text-xs font-medium text-text-secondary mt-0.5">{cinema.name}</p>
                  <div className="text-xs text-text-secondary mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 text-text-secondary" />
                      {formattedShowDate}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 text-text-secondary" />
                      {formattedShowTime}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {show.screenName || 'Screen 1'} • {show.format || '2D'} • {show.language}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-text-secondary font-semibold">Seats:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSeats.map((s) => (
                        <span
                          key={s.id}
                          className="rounded bg-surface px-2 py-0.5 text-xs font-black text-brand border border-border-subtle"
                        >
                          {s.id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Stub Divider */}
              <div className="my-4 border-t border-dashed border-border-subtle relative">
                <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-surface" />
                <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-surface" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-text-secondary block">Customer</span>
                  <span className="font-bold text-text-primary">{confirmedBooking.customer?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-text-secondary block">Total Paid (Demo)</span>
                  <span className="font-extrabold text-text-primary text-sm">
                    ₹{Math.round(confirmedBooking.totalPaise / 100)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border-subtle bg-surface p-3 text-[11px] text-text-secondary leading-relaxed max-w-sm flex items-center gap-2 text-left">
              <InfoIcon className="h-4 w-4 text-brand shrink-0" />
              <span>CineSuno Bolna Buildathon Prototype: Simulated payment confirmed and seats registered in memory.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-hover transition shadow-sm"
            >
              Done / Return to Movies
            </button>
          </div>
        ) : (
          /* ---------------- ORDER REVIEW & CHECKOUT FORM ---------------- */
          <form onSubmit={handleConfirmPayment} className="flex flex-col gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Step 2 of 2: Checkout & Review
              </span>
              <h2 id="checkout-dialog-title" className="text-2xl font-black text-text-primary mt-1">
                Order Summary
              </h2>
              <p className="text-xs text-text-secondary">
                Verify your showtime details and complete your simulated reservation.
              </p>
            </div>

            {/* Movie & Show Preview Card */}
            <div className="flex gap-4 rounded-2xl border border-border-subtle bg-surface-elevated p-4">
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl bg-surface border border-border-subtle">
                <Image
                  src={posterSrc}
                  alt={movie.title}
                  fill
                  unoptimized
                  onError={() => setPosterError(true)}
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary">{movie.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{cinema.name}</p>
                <div className="text-xs text-text-secondary mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3 text-text-secondary" />
                    {formattedShowDate}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 text-text-secondary" />
                    {formattedShowTime}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-primary border border-border-subtle">
                    {show.format || '2D'}
                  </span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-text-secondary border border-border-subtle">
                    {show.language}
                  </span>
                  <span className="text-xs font-semibold text-brand ml-1">
                    Seats: {selectedSeats.map((s) => s.id).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information Input */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Ticket Delivery Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customer-name" className="block text-xs font-medium text-text-secondary mb-1">
                    Your Name *
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label htmlFor="customer-phone" className="block text-xs font-medium text-text-secondary mb-1">
                    Mobile Number *
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Payment Simulation Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'CARD', 'DEMO'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-xl border py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === method
                        ? 'border-brand bg-selected text-brand shadow-xs'
                        : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary hover:border-brand'
                    }`}
                  >
                    {method === 'UPI' ? 'UPI Instant' : method === 'CARD' ? 'Card (Credit/Debit)' : 'Demo Sandbox'}
                  </button>
                ))}
              </div>
            </div>

            {/* Itemized Price Breakdown */}
            <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-4 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Tickets ({selectedSeats.length} seats)</span>
                <span className="font-semibold text-text-primary">
                  ₹{Math.round(quote.subtotalPaise / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <span>
                  Convenience Fee (₹5/ticket, capped at ₹30 max)
                </span>
                <span className="font-semibold text-text-primary">
                  ₹{Math.round(quote.convenienceFeePaise / 100)}
                </span>
              </div>
              <div className="border-t border-border-subtle pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-text-primary">Total Amount</span>
                <span className="text-lg font-black text-text-primary">
                  ₹{Math.round(quote.totalPaise / 100)}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl border border-border-subtle bg-selected p-3 text-xs text-text-primary font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Disclaimer banner */}
            <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3 text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
              <InfoIcon className="h-4 w-4 text-brand shrink-0 mt-0.5" />
              <span>Prototype Verification: No actual credit card or bank credentials are charged. Completing this order validates schema contracts and records your booking in the server-side demo state.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={checkoutStep === 'processing'}
                className="w-1/3 rounded-2xl border border-border-subtle bg-surface-elevated py-3 text-xs font-semibold text-text-primary hover:border-brand transition disabled:opacity-50"
              >
                Modify Seats
              </button>

              <button
                type="submit"
                disabled={checkoutStep === 'processing'}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover transition disabled:opacity-50"
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
