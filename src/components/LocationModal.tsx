'use client';

import React, { useState } from 'react';
import { useToast } from '@/lib/toast';
import { XIcon } from '@/components/icons';

interface LocationModalProps {
  currentCity: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

const POPULAR_CITIES = [
  { name: 'Bengaluru', state: 'Karnataka', tag: 'Tech Hub' },
  { name: 'Mumbai', state: 'Maharashtra', tag: 'Bollywood' },
  { name: 'Delhi-NCR', state: 'National Capital', tag: 'Metro' },
  { name: 'Hyderabad', state: 'Telangana', tag: 'Tollywood' },
  { name: 'Chennai', state: 'Tamil Nadu', tag: 'Kollywood' },
  { name: 'Ahmedabad', state: 'Gujarat', tag: 'Commercial' },
  { name: 'Pune', state: 'Maharashtra', tag: 'Cultural' },
  { name: 'Kolkata', state: 'West Bengal', tag: 'Heritage' },
  { name: 'Kochi', state: 'Kerala', tag: 'Mollywood' },
  { name: 'Chandigarh', state: 'Punjab/Haryana', tag: 'City Beautiful' },
];

export default function LocationModal({
  currentCity,
  isOpen,
  onClose,
  onSelectCity,
}: LocationModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const toast = useToast();

  if (!isOpen) return null;

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsDetecting(false);
          // For demo, lock in Bengaluru
          onSelectCity('Bengaluru');
          toast.success('Location detected: Bengaluru');
          onClose();
        },
        () => {
          setIsDetecting(false);
          toast.info('Could not access GPS. Defaulted to Bengaluru.');
          onSelectCity('Bengaluru');
          onClose();
        },
        { timeout: 4000 }
      );
    } else {
      setIsDetecting(false);
      onSelectCity('Bengaluru');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Choose Cinema Location
            </span>
            <h2 className="text-xl font-bold text-text-primary mt-0.5">Select Your City</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition"
            aria-label="Close location selector"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Search & GPS Input */}
        <div className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city or state (e.g. Hyderabad, Kerala)..."
            className="w-full rounded-2xl border border-border-subtle bg-surface-elevated/40 px-4 py-2.5 text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-brand focus:outline-hidden"
            autoFocus
          />

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs font-bold text-brand hover:border-brand transition shadow-xs disabled:opacity-50"
          >
            <span>{isDetecting ? 'Detecting coordinates...' : 'Auto-Detect My Current Location'}</span>
          </button>
        </div>

        {/* Popular Cities Grid */}
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-3">
            Popular Cities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {filteredCities.map((c) => {
              const isSelected = c.name.toLowerCase() === currentCity.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    onSelectCity(c.name);
                    toast.success(`Location set to ${c.name}`);
                    onClose();
                  }}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition shadow-xs ${
                    isSelected
                      ? 'border-brand bg-surface-selected text-brand'
                      : 'border-border-subtle bg-surface hover:border-brand text-text-primary'
                  }`}
                >
                  <span className="font-bold text-xs">{c.name}</span>
                  <span className="text-[10px] text-text-secondary mt-0.5">{c.state}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
