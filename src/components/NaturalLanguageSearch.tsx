'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { parseNaturalLanguageQuery, ParsedMovieQuery } from '@/lib/query-parser';
import { createSpeechRecognitionAdapter, VoiceState } from '@/lib/speech-recognition';
import { SearchIcon, MicIcon, XIcon, InfoIcon, SparklesIcon } from '@/components/icons';

interface NaturalLanguageSearchProps {
  onParsedQueryChange: (parsed: ParsedMovieQuery) => void;
  activeQuery: string;
  onClearQuery: () => void;
}

const SAMPLE_PROMPTS = [
  'Telugu action movie tonight',
  'Something good for a family outing',
  'English movies after 7 PM',
  'Find a show for 3 people',
  'Best rated sci-fi movies',
];

export function NaturalLanguageSearch({
  onParsedQueryChange,
  activeQuery,
  onClearQuery,
}: NaturalLanguageSearchProps) {
  const [inputValue, setInputValue] = useState(activeQuery);
  const [prevActiveQuery, setPrevActiveQuery] = useState(activeQuery);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognitionAdapter> | null>(null);

  // Synchronize state when activeQuery prop changes from outside without useEffect cascading render
  if (activeQuery !== prevActiveQuery) {
    setPrevActiveQuery(activeQuery);
    setInputValue(activeQuery);
  }

  const parsed: ParsedMovieQuery = useMemo(() => parseNaturalLanguageQuery(inputValue), [inputValue]);

  const handleApplyQuery = useCallback(
    (queryText: string) => {
      setInputValue(queryText);
      const result = parseNaturalLanguageQuery(queryText);
      onParsedQueryChange(result);
    },
    [onParsedQueryChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const result = parseNaturalLanguageQuery(val);
    onParsedQueryChange(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyQuery(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onClearQuery();
  };

  const handleRemoveChip = (chipType: string) => {
    const remainingChips = parsed.extractedChips.filter((c) => c.type !== chipType);
    if (remainingChips.length === 0) {
      handleClear();
    } else {
      const newQuery = remainingChips.map((c) => c.value).join(' ');
      handleApplyQuery(newQuery);
    }
  };

  // Voice search toggle
  const toggleVoiceSearch = () => {
    if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      setVoiceState('idle');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = createSpeechRecognitionAdapter();
    }

    const adapter = recognitionRef.current;
    if (!adapter.isSupported) {
      setVoiceState('unsupported');
      setVoiceMessage('Browser speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    setVoiceState('listening');
    setVoiceMessage('Listening... speak now (e.g. "Find Kalki in Telugu tonight")');

    adapter.start(
      (result) => {
        setInputValue(result.transcript);
        if (result.isFinal) {
          setVoiceState('idle');
          setVoiceMessage(null);
          handleApplyQuery(result.transcript);
        }
      },
      (state, message) => {
        setVoiceState(state);
        setVoiceMessage(message);
      },
      () => {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
        setVoiceMessage(null);
      }
    );
  };

  return (
    <div className="w-full">
      {/* Search Input Bar with Integrated Microphone */}
      <div className="relative flex items-center rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-sm transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center text-text-secondary">
          <SearchIcon className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search by movie title, language, genre, or showtime..."
          className="w-full bg-transparent px-3 py-2 text-sm sm:text-base font-medium text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
          aria-label="Movie search query"
        />

        {/* Clear Button if input has text */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-2 rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition"
            aria-label="Clear search input"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}

        {/* Microphone Button */}
        <button
          type="button"
          onClick={toggleVoiceSearch}
          aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start voice search'}
          className={`relative flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${
            voiceState === 'listening'
              ? 'bg-brand text-white shadow-md animate-pulse'
              : 'bg-surface-elevated text-brand hover:bg-selected'
          }`}
        >
          {voiceState === 'listening' ? (
            <>
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <MicIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Voice</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Status / Feedback Message */}
      {voiceMessage && (
        <div className="mt-2.5 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-xs font-medium text-text-primary flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <MicIcon className="w-4 h-4 text-brand shrink-0" />
            <span>{voiceMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceMessage(null)}
            className="text-text-secondary hover:text-text-primary ml-2 rounded p-0.5"
            aria-label="Dismiss message"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Extracted Query Criteria Chips */}
      {parsed.extractedChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Filters:
          </span>
          {parsed.extractedChips.map((chip) => (
            <span
              key={`${chip.type}-${chip.value}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-selected px-2.5 py-1 text-xs font-semibold text-brand shadow-2xs"
            >
              <span className="font-medium text-text-secondary">{chip.label}:</span>
              <span>{chip.value}</span>
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.type)}
                className="ml-1 text-text-secondary hover:text-brand"
                aria-label={`Remove filter ${chip.label}`}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-text-secondary hover:text-brand underline decoration-dotted ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Ambiguity Clarification Notice */}
      {parsed.isAmbiguous && parsed.clarificationMessage && (
        <div className="mt-3 rounded-2xl border border-border-subtle bg-surface-elevated p-3 text-xs text-text-secondary flex items-start gap-2.5">
          <InfoIcon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-text-primary">Clarification needed: </span>
            {parsed.clarificationMessage}
          </div>
        </div>
      )}

      {/* Quick Sample Query Prompts */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1 mr-1">
          <SparklesIcon className="w-3 h-3 text-brand" />
          <span>Suggestions:</span>
        </span>
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleApplyQuery(prompt)}
            className="rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary transition hover:border-brand hover:bg-selected hover:text-brand"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
