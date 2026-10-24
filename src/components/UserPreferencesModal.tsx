'use client';

import React, { useState } from 'react';
import {
  UserPreferences,
  savePreferences,
  resetPreferences,
} from '@/lib/preferences';
import { XIcon, CheckIcon, ClockIcon, SettingsIcon } from '@/components/icons';
import { useToast } from '@/lib/toast';

interface UserPreferencesModalProps {
  currentPreferences: UserPreferences;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UserPreferences) => void;
}

const ALL_LANGUAGES = ['Hindi', 'Telugu', 'Tamil', 'English', 'Kannada', 'Malayalam'];
const ALL_GENRES = ['Action', 'Sci-Fi', 'Comedy', 'Horror', 'Drama', 'Thriller', 'Adventure'];
const TIME_OPTIONS: Array<{ value: UserPreferences['preferredTimeOfDay']; label: string; sub: string }> = [
  { value: 'any', label: 'Any Time', sub: 'All shows' },
  { value: 'morning', label: 'Morning', sub: '9 AM - 12 PM' },
  { value: 'afternoon', label: 'Afternoon', sub: '12 PM - 5 PM' },
  { value: 'evening', label: 'Evening', sub: '5 PM - 9 PM' },
  { value: 'night', label: 'Night', sub: '9 PM onwards' },
];

const SEATING_OPTIONS: Array<{ value: UserPreferences['preferredSeating']; label: string }> = [
  { value: 'standard', label: 'Standard Tier' },
  { value: 'premium', label: 'Premium Tier' },
  { value: 'recliner', label: 'Luxury Recliner' },
];

export function UserPreferencesModal({
  currentPreferences,
  isOpen,
  onClose,
  onSave,
}: UserPreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(currentPreferences);
  const { toast } = useToast();

  if (!isOpen) return null;

  const toggleLanguage = (lang: string) => {
    setPreferences((prev) => {
      const exists = prev.languages.includes(lang);
      if (exists) {
        if (prev.languages.length === 1) return prev;
        return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      }
      return { ...prev, languages: [...prev.languages, lang] };
    });
  };

  const toggleGenre = (genre: string) => {
    setPreferences((prev) => {
      const exists = prev.genres.includes(genre);
      if (exists) {
        if (prev.genres.length === 1) return prev;
        return { ...prev, genres: prev.genres.filter((g) => g !== genre) };
      }
      return { ...prev, genres: [...prev.genres, genre] };
    });
  };

  const handleSave = () => {
    savePreferences(preferences);
    onSave(preferences);
    toast.success('Preferences saved', 'Your movie discovery preferences have been updated.');
    onClose();
  };

  const handleReset = () => {
    const defaults = resetPreferences();
    setPreferences(defaults);
    onSave(defaults);
    toast.info('Preferences reset', 'Restored default recommendations preferences.');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border-subtle bg-surface p-6 shadow-2xl transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated text-brand border border-border-subtle">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="preferences-modal-title" className="text-base font-black text-text-primary leading-tight">
                Discovery Preferences
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Customize catalogue ranking. Saved on your device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition"
            aria-label="Close dialog"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Languages */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-primary block mb-2">
              Preferred Languages
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_LANGUAGES.map((lang) => {
                const isSelected = preferences.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'border border-brand bg-brand text-white shadow-2xs'
                        : 'border border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                    <span>{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-primary block mb-2">
              Favorite Genres
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_GENRES.map((genre) => {
                const isSelected = preferences.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'border border-brand bg-brand text-white shadow-2xs'
                        : 'border border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-primary block mb-2 flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-brand" />
              <span>Preferred Showtime</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIME_OPTIONS.map((time) => {
                const isSelected = preferences.preferredTimeOfDay === time.value;
                return (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, preferredTimeOfDay: time.value }))}
                    className={`flex flex-col items-start rounded-xl p-2.5 text-left border transition ${
                      isSelected
                        ? 'border-brand bg-selected text-brand font-bold'
                        : 'border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    <span className="text-xs font-bold text-text-primary">{time.label}</span>
                    <span className="text-[10px] text-text-secondary">{time.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seating Preference */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-primary block mb-2">
              Preferred Seating Category
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {SEATING_OPTIONS.map((seat) => {
                const isSelected = preferences.preferredSeating === seat.value;
                return (
                  <button
                    key={seat.value}
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, preferredSeating: seat.value }))}
                    className={`rounded-xl p-2.5 text-xs font-medium border text-left transition ${
                      isSelected
                        ? 'border-brand bg-selected text-brand font-bold'
                        : 'border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    {seat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Range Preference */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-primary block mb-2">
              Budget Target (Per Ticket)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Any Budget', value: undefined },
                { label: 'Up to ₹200', value: 20000 },
                { label: 'Up to ₹300', value: 30000 },
                { label: 'Up to ₹450', value: 45000 },
              ].map((b) => {
                const isSelected = preferences.maxBudgetPerTicketPaise === b.value;
                return (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, maxBudgetPerTicketPaise: b.value }))}
                    className={`rounded-xl p-2 text-xs font-semibold border text-center transition ${
                      isSelected
                        ? 'border-brand bg-selected text-brand font-bold'
                        : 'border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility Preferences */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-primary block mb-2">
              Accessibility Requirements
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { label: 'Standard Seating', value: 'none' as const },
                { label: 'Wheelchair Space', value: 'wheelchair' as const },
                { label: 'Companion Adjacent', value: 'companion' as const },
              ].map((acc) => {
                const isSelected = preferences.accessibilityNeed === acc.value;
                return (
                  <button
                    key={acc.value}
                    type="button"
                    onClick={() => setPreferences((p) => ({ ...p, accessibilityNeed: acc.value }))}
                    className={`rounded-xl p-2.5 text-xs font-medium border text-left transition ${
                      isSelected
                        ? 'border-brand bg-selected text-brand font-bold'
                        : 'border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand/40'
                    }`}
                  >
                    {acc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3 text-[11px] text-text-secondary leading-relaxed">
            <span className="font-bold text-text-primary">Private & Local:</span> Stored strictly in your current browser. CineSuno never transmits or synchronizes your personal preferences across external accounts.
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-text-secondary hover:text-brand underline decoration-dotted"
          >
            Reset defaults
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-subtle px-3.5 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-elevated transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
