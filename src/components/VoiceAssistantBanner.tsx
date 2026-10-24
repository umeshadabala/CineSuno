'use client';

import React, { useState } from 'react';
import { MicIcon } from '@/components/icons';

interface VoiceAssistantBannerProps {
  onSampleVoiceCommand: (query: string) => void;
}

const SAMPLE_COMMANDS = [
  'Show Action movies',
  'Find Kalki in Telugu',
  'Now showing in Hindi',
  'Best rated movies',
];

export function VoiceAssistantBanner({
  onSampleVoiceCommand,
}: VoiceAssistantBannerProps) {
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);

  const simulateVoiceInput = (command: string) => {
    setIsListening(true);
    setActiveSpeechText(`“${command}”`);

    setTimeout(() => {
      setIsListening(false);
      onSampleVoiceCommand(command);
    }, 1200);
  };

  return (
    <div className="relative my-6 overflow-hidden rounded-3xl border border-border-subtle bg-surface-elevated/80 p-6 shadow-sm backdrop-blur-sm transition-colors">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/20">
            {isListening ? (
              <span className="flex h-5 w-5 items-center justify-center">
                <span className="h-full w-full rounded-full bg-white/80 animate-ping" />
              </span>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                Bolna Voice Agent
              </h2>
              <span className="rounded-full bg-surface border border-border-subtle px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                Active Demo
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary max-w-xl">
              {isListening
                ? `Listening... ${activeSpeechText}`
                : 'Experience conversational booking. Tap any sample command below to simulate voice discovery:'}
            </p>
          </div>
        </div>

        {/* Sample Voice Prompts */}
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              disabled={isListening}
              onClick={() => simulateVoiceInput(cmd)}
              className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:border-brand hover:bg-selected focus:outline-none focus:ring-2 focus:ring-brand active:scale-95 disabled:opacity-50"
            >
              <MicIcon className="h-3.5 w-3.5 text-brand" />
              <span>“{cmd}”</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
