'use client';

import { useEffect, useState } from 'react';
import { ReviewItem } from '@/components/ReviewItem';
import { IconRefresh, IconSparkles } from '@tabler/icons-react';
import type { ReviewAnalysis } from '@/agents/schemas';

interface ReviewRow {
  id: string;
  rating: number;
  body: string;
  language: string | null;
  channel: string;
  postedAt: string | null;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; analysis: ReviewAnalysis }
  | { kind: 'error'; message: string };

export function ReviewsClient({ locale, reviews }: { locale: string; reviews: ReviewRow[] }) {
  const isTr = locale === 'tr';
  const [state, setState] = useState<State>({ kind: 'loading' });

  const runAnalysis = async () => {
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/reviews/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, daysBack: 90 }),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setState({ kind: 'ready', analysis: data.analysis });
      } else {
        setState({ kind: 'error', message: data.error ?? 'Analysis failed' });
      }
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Network error' });
    }
  };

  useEffect(() => {
    runAnalysis();
    // Only on mount; manual retry via button afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 980 }}>
      {/* Header */}
      <div>
        <span className="section-eyebrow">{isTr ? 'Yorumlar' : 'Reviews'}</span>
        <h1
          className="landing-sans-display"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: 0 }}
        >
          {isTr ? 'Müşterilerin' : 'What customers'}{' '}
          <em
            className="landing-display"
            style={{
              fontStyle: 'italic',
              fontWeight: 400,
              background:
                'linear-gradient(115deg, var(--c-emerald) 0%, var(--c-amber) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {isTr ? 'gerçekte ne diyor.' : 'really think.'}
          </em>
        </h1>
      </div>

      {/* Analysis section */}
      {state.kind === 'loading' && <AnalysisSkeleton isTr={isTr} />}
      {state.kind === 'ready' && <AnalysisCard analysis={state.analysis} isTr={isTr} onRefresh={runAnalysis} />}
      {state.kind === 'error' && <AnalysisError isTr={isTr} message={state.message} onRetry={runAnalysis} />}

      {/* Reviews list — always visible, never blocked */}
      <div>
        <span
          className="social-label"
          style={{ marginBottom: 12, color: 'var(--fg-mute)' }}
        >
          {isTr ? `Son ${reviews.length} yorum` : `Latest ${reviews.length} reviews`}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r) => (
            <ReviewItem
              key={r.id}
              rating={r.rating}
              body={r.body}
              language={r.language}
              channel={r.channel}
              postedAt={r.postedAt}
            />
          ))}
          {reviews.length === 0 && (
            <div
              style={{
                padding: 24,
                border: '1px dashed var(--border)',
                borderRadius: 14,
                textAlign: 'center',
                color: 'var(--fg-mute)',
                fontSize: 14,
              }}
            >
              {isTr ? 'Henüz yorum yok.' : 'No reviews yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisCard({
  analysis,
  isTr,
  onRefresh,
}: {
  analysis: ReviewAnalysis;
  isTr: boolean;
  onRefresh: () => void;
}) {
  const total =
    analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative || 1;

  return (
    <div className="reviews-summary">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span className="section-eyebrow" style={{ margin: 0, color: 'var(--c-emerald)' }}>
          <IconSparkles size={11} stroke={2.2} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {isTr ? 'Yorum Ajanı Analizi' : 'Reviews Agent Analysis'}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="social-mini-btn"
          title={isTr ? 'Tekrar analiz et' : 'Re-analyze'}
        >
          <IconRefresh size={11} stroke={2.4} />
          {isTr ? 'Yenile' : 'Refresh'}
        </button>
      </div>

      <div className="reviews-sentiment-grid">
        <SentimentCard
          tone="positive"
          count={analysis.sentiment.positive}
          total={total}
          label={isTr ? 'Olumlu' : 'Positive'}
        />
        <SentimentCard
          tone="neutral"
          count={analysis.sentiment.neutral}
          total={total}
          label={isTr ? 'Nötr' : 'Neutral'}
        />
        <SentimentCard
          tone="negative"
          count={analysis.sentiment.negative}
          total={total}
          label={isTr ? 'Olumsuz' : 'Negative'}
        />
      </div>

      {analysis.topThemes.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <span className="social-label" style={{ marginBottom: 12 }}>
            {isTr ? 'Öne çıkan temalar' : 'Top themes'}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {analysis.topThemes.slice(0, 8).map((t) => (
              <span key={t.theme} className="review-theme-pill">
                {t.theme}
                <span className="review-theme-count">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.draftReplies && analysis.draftReplies.length > 0 && (
        <div className="docs-callout" style={{ marginTop: 20 }}>
          <strong>{isTr ? 'Aksiyon' : 'Action'}:</strong>{' '}
          {isTr
            ? `Yorum Ajanı ${analysis.draftReplies.length} negatif yorum için yanıt taslağı hazırladı.`
            : `The Reviews Agent drafted ${analysis.draftReplies.length} replies for negative reviews.`}
        </div>
      )}
    </div>
  );
}

function AnalysisSkeleton({ isTr }: { isTr: boolean }) {
  return (
    <div className="reviews-summary">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div className="thinking-dots">
          <span /><span /><span />
        </div>
        <span style={{ fontSize: 12, color: 'var(--fg-mute)', letterSpacing: '0.06em' }}>
          {isTr ? 'YORUM AJANI ANALİZ EDİYOR…' : 'REVIEWS AGENT ANALYZING…'}
        </span>
      </div>
      <div className="reviews-sentiment-grid">
        <div className="sentiment-card sentiment-skeleton" />
        <div className="sentiment-card sentiment-skeleton" />
        <div className="sentiment-card sentiment-skeleton" />
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[60, 80, 50, 90, 70].map((w, i) => (
          <span key={i} className="review-theme-skeleton" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

function AnalysisError({
  isTr,
  message,
  onRetry,
}: {
  isTr: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="reviews-summary"
      style={{
        borderColor: 'color-mix(in srgb, var(--c-rose) 25%, var(--border))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <span
            className="section-eyebrow"
            style={{ margin: 0, color: 'var(--c-rose)', marginBottom: 8 }}
          >
            {isTr ? 'Yorum Ajanı yanıt veremedi' : 'Reviews Agent failed'}
          </span>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--fg-mute)', lineHeight: 1.55 }}>
            {isTr
              ? 'Yorum listesi aşağıda — ajanı yeniden çağırmayı deneyebilirsin.'
              : 'The review list is below — you can try re-running the agent.'}
          </p>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            {message.slice(0, 200)}
          </p>
        </div>
        <button type="button" onClick={onRetry} className="btn-ghost btn-small">
          <IconRefresh size={13} stroke={2.4} />
          {isTr ? 'Tekrar dene' : 'Retry'}
        </button>
      </div>
    </div>
  );
}

function SentimentCard({
  tone,
  count,
  total,
  label,
}: {
  tone: 'positive' | 'neutral' | 'negative';
  count: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className={`sentiment-card sentiment-${tone}`}>
      <span className="sentiment-label">{label}</span>
      <span className="sentiment-count">{count}</span>
      <span className="sentiment-bar">
        <span className="sentiment-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="sentiment-pct">{pct.toFixed(0)}%</span>
    </div>
  );
}
