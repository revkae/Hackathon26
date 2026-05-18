'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API hook. Wraps SpeechRecognition with a clean React API.
 * Returns `supported=false` on browsers without the API (e.g. desktop Firefox);
 * UI should fall back to disabled state.
 */
export interface UseVoiceInputResult {
  supported: boolean;
  listening: boolean;
  transcript: string;          // accumulated final results during the current session
  start: () => void;
  stop: () => void;
  reset: () => void;
}

type SR = typeof window extends { SpeechRecognition: infer T } ? T : never;

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function useVoiceInput({
  lang = 'tr-TR',
  onFinalTranscript,
}: {
  lang?: string;
  onFinalTranscript?: (text: string) => void;
} = {}): UseVoiceInputResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Both Chromium and webkit-prefixed variants
    const Ctor =
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);

    const rec = new (Ctor as new () => SpeechRecognitionLike)();
    rec.lang = lang;
    rec.continuous = false;       // single utterance per session keeps mobile happy
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = '';
      let finalChunk = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev + ' ' + finalChunk).trim());
        onFinalRef.current?.(finalChunk.trim());
      } else if (interim) {
        // Also surface interim so UI can show live partial text
        setTranscript(interim);
      }
    };

    rec.onerror = () => {
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    recRef.current = rec;
  }, [lang]);

  const start = useCallback(() => {
    if (!recRef.current || listening) return;
    setTranscript('');
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => setTranscript(''), []);

  return { supported, listening, transcript, start, stop, reset };
}
