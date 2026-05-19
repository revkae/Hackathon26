'use client';

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  IconArrowUp,
  IconMicrophone,
  IconPaperclip,
  IconSparkles,
} from '@tabler/icons-react';
import { useVoiceInput } from './useVoiceInput';

interface ChatInputProps {
  placeholder: string;
  modes: string[];
  signupHref: string;
  rotatingPlaceholders?: string[];
}

export function ChatInput({
  placeholder,
  modes,
  signupHref,
  rotatingPlaceholders,
}: ChatInputProps) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'tr';

  const fileRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [value, setValue] = useState('');
  const [modeIndex, setModeIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [typedPlaceholder, setTypedPlaceholder] = useState(placeholder);
  const [isFocused, setIsFocused] = useState(false);

  // Web Speech API
  const voice = useVoiceInput({
    lang: locale === 'tr' ? 'tr-TR' : 'en-US',
    onFinalTranscript: (chunk) => {
      // Append to existing input value
      setValue((prev) => (prev ? `${prev} ${chunk}`.trim() : chunk));
    },
  });

  // --- Typewriter rotating placeholder ---
  useEffect(() => {
    if (!rotatingPlaceholders || rotatingPlaceholders.length === 0) {
      setTypedPlaceholder(placeholder);
      return;
    }
    if (value || isFocused || voice.listening) return;

    let cancelled = false;
    let pIdx = 0;
    let charIdx = 0;
    let phase: 'typing' | 'hold' | 'deleting' = 'typing';

    const tick = () => {
      if (cancelled) return;
      const current = rotatingPlaceholders[pIdx];

      if (phase === 'typing') {
        charIdx++;
        setTypedPlaceholder(current.slice(0, charIdx));
        if (charIdx >= current.length) {
          phase = 'hold';
          setTimeout(tick, 1800);
          return;
        }
        setTimeout(tick, 38 + Math.random() * 30);
      } else if (phase === 'hold') {
        phase = 'deleting';
        setTimeout(tick, 60);
      } else {
        charIdx--;
        setTypedPlaceholder(current.slice(0, Math.max(charIdx, 0)));
        if (charIdx <= 0) {
          phase = 'typing';
          pIdx = (pIdx + 1) % rotatingPlaceholders.length;
          setTimeout(tick, 240);
          return;
        }
        setTimeout(tick, 22);
      }
    };

    setTimeout(tick, 600);
    return () => {
      cancelled = true;
    };
  }, [rotatingPlaceholders, placeholder, value, isFocused, voice.listening]);

  const submit = () => {
    router.push(signupHref);
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const cycleMode = () => setModeIndex((i) => (i + 1) % modes.length);

  const handleAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const toggleMic = () => {
    if (voice.listening) voice.stop();
    else voice.start();
  };

  // Combine value + live interim transcript so users see what's being heard
  const displayValue = voice.listening && voice.transcript ? `${value} ${voice.transcript}`.trim() : value;

  return (
    <form
      className="chat-mock reveal reveal-4"
      style={{ marginTop: 44 }}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="chat-textarea"
        placeholder={typedPlaceholder}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKey}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
      />

      <input ref={fileRef} type="file" hidden onChange={handleAttach} />

      <div className="chat-mock-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="chat-send"
            style={{ width: 32, height: 32 }}
            aria-label="Dosya ekle"
            onClick={() => fileRef.current?.click()}
            title="Dosya ekle"
          >
            <IconPaperclip size={15} stroke={2.2} />
          </button>
          <button
            type="button"
            className="chat-pill"
            onClick={cycleMode}
            title="Modu değiştir"
          >
            <IconSparkles size={12} stroke={2.2} />
            {modes[modeIndex]}
          </button>
          {fileName && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--fg-mute)',
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={fileName}
            >
              {fileName}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className={`chat-send${voice.listening ? ' is-active' : ''}`}
            style={{ width: 32, height: 32 }}
            aria-label={voice.listening ? 'Kaydı durdur' : 'Sesli komut'}
            aria-pressed={voice.listening}
            onClick={toggleMic}
            disabled={!voice.supported}
            title={
              !voice.supported
                ? 'Tarayıcı sesli komutu desteklemiyor'
                : voice.listening
                ? 'Kaydı durdur'
                : 'Sesli komut'
            }
          >
            <IconMicrophone size={15} stroke={2.2} />
          </button>
          <button
            type="submit"
            className="chat-send is-primary"
            aria-label="Gönder"
            title="Gönder"
          >
            <IconArrowUp size={17} stroke={2.4} />
          </button>
        </div>
      </div>
    </form>
  );
}
