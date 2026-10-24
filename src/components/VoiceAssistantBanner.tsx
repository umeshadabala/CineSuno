'use client';

import React, { useState } from 'react';

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
    <div className="relative my-6 overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-zinc-950 to-amber-950/30 p-6 shadow-xl backdrop-blur-sm">
      {/* Background glow effects */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-600/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-600/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-950/60">
            {isListening ? (
              <span className="flex h-6 w-6 items-center justify-center">
                <span className="h-full w-full rounded-full bg-white/80 animate-ping" />
              </span>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Bolna Voice Agent
              </h2>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ACTIVE DEMO
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-300 max-w-xl">
              {isListening
                ? `Listening... ${activeSpeechText}`
                : 'Experience conversational booking. Tap any sample voice command below or tap the microphone to simulate:'}
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
              className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-rose-400 hover:bg-zinc-800 hover:text-white active:scale-95 disabled:opacity-50"
            >
              <span className="text-rose-400">🎙️</span>
              <span>“{cmd}”</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
