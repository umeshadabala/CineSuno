'use client';

import React from 'react';
import { PlusIcon, MinusIcon, UsersIcon } from '@/components/icons';

interface TicketQuantitySelectorProps {
  quantity: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function TicketQuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 20,
  label,
  size = 'md',
  disabled = false,
}: TicketQuantitySelectorProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > min && !disabled) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < max && !disabled) {
      onChange(quantity + 1);
    }
  };

  const isAtMin = quantity <= min;
  const isAtMax = quantity >= max;

  return (
    <div className="inline-flex flex-col gap-1">
      {label && (
        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </span>
      )}

      <div
        role="group"
        aria-label="Ticket quantity selection"
        className={`inline-flex items-center rounded-xl border border-border-subtle bg-surface p-1 shadow-2xs transition-colors ${
          size === 'sm' ? 'h-8' : 'h-10'
        }`}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isAtMin || disabled}
          aria-label="Decrease ticket count"
          className="flex h-full w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <MinusIcon className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center justify-center px-3 min-w-[54px] text-center">
          <div className="flex items-center gap-1.5">
            <UsersIcon className="w-3.5 h-3.5 text-brand shrink-0" />
            <span
              className={`font-black text-text-primary ${
                size === 'sm' ? 'text-xs' : 'text-sm'
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {quantity}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={isAtMax || disabled}
          aria-label="Increase ticket count"
          className="flex h-full w-8 items-center justify-center rounded-lg text-text-secondary transition hover:bg-surface-elevated hover:text-text-primary focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
