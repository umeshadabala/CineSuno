export type VoiceState = 'idle' | 'listening' | 'processing' | 'unsupported' | 'permission_denied' | 'error';

export interface VoiceRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface VoiceRecognitionAdapter {
  isSupported: boolean;
  start: (
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (state: VoiceState, message: string) => void,
    onEnd: () => void
  ) => void;
  stop: () => void;
  abort: () => void;
}

interface WebSpeechEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface WebSpeechErrorEvent {
  error: string;
  message?: string;
}

interface WebSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: WebSpeechEvent) => void) | null;
  onerror: ((event: WebSpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => WebSpeechRecognition;

/**
 * Creates a browser SpeechRecognition adapter.
 * Uses window.SpeechRecognition or window.webkitSpeechRecognition.
 * Discloses that this uses client-side Web Speech API and cleanly wraps it.
 */
export function createSpeechRecognitionAdapter(): VoiceRecognitionAdapter {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      start: () => {},
      stop: () => {},
      abort: () => {},
    };
  }

  const windowWithSpeech = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  const SpeechRecognitionAPI = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    return {
      isSupported: false,
      start: (_onResult, onError) => {
        onError('unsupported', 'Browser speech recognition is not supported in this browser. Please type your query.');
      },
      stop: () => {},
      abort: () => {},
    };
  }

  let recognitionInstance: WebSpeechRecognition | null = null;

  return {
    isSupported: true,
    start: (onResult, onError, onEnd) => {
      try {
        if (recognitionInstance) {
          recognitionInstance.abort();
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Default to Indian English, compatible with Indian titles & accents

        recognition.onresult = (event: WebSpeechEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          onResult({
            transcript: finalTranscript || interimTranscript,
            isFinal: Boolean(finalTranscript),
          });
        };

        recognition.onerror = (event: WebSpeechErrorEvent) => {
          if (event.error === 'not-allowed') {
            onError('permission_denied', 'Microphone permission was denied. Please allow microphone access or type your query.');
          } else if (event.error === 'no-speech') {
            onError('idle', 'No speech detected. Please try again.');
          } else {
            onError('error', `Speech input error: ${event.error || 'Unknown error'}`);
          }
        };

        recognition.onend = () => {
          onEnd();
        };

        recognition.start();
        recognitionInstance = recognition;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not start speech recognition.';
        onError('error', message);
      }
    },
    stop: () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {
          // ignore
        }
      }
    },
    abort: () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.abort();
        } catch {
          // ignore
        }
      }
    },
  };
}
