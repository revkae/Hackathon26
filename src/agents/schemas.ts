import { z } from 'zod';

export const ImpactSchema = z.enum(['low', 'medium', 'high']);
export const StatusSchema = z.enum(['ok', 'warn', 'critical', 'info']);

export const SeoSuggestionSchema = z.object({
  productId: z.string(),
  oldTitle: z.string(),
  newTitle: z.string().min(1),
  reasoning: z.string(),
  expectedImpact: ImpactSchema,
  keywords: z.array(z.string()).optional(),
});

export const MarketingPostSchema = z.object({
  productId: z.string(),
  caption: z.string().min(1),
  hashtags: z.array(z.string()),
  imagePrompts: z.array(z.string()).min(1).max(5),
  optimalTime: z.string().optional(),
  tone: z.enum(['casual', 'professional', 'premium']),
});

export const PriceSuggestionSchema = z.object({
  productId: z.string(),
  currentPrice: z.number(),
  suggestedPrice: z.number(),
  range: z.tuple([z.number(), z.number()]),
  reasoning: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  expectedSalesChangePct: z.number().optional(),
});

export const SentimentBreakdownSchema = z.object({
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
});

export const ReviewAnalysisSchema = z.object({
  productId: z.string(),
  totalReviews: z.number(),
  sentiment: SentimentBreakdownSchema,
  topThemes: z.array(z.object({
    theme: z.string(),
    count: z.number(),
    sentiment: z.enum(['positive', 'negative', 'mixed']),
  })),
  draftReplies: z.array(z.object({
    reviewId: z.string(),
    reply: z.string(),
  })).optional(),
});

export const CashFlowForecastSchema = z.object({
  scenario: z.string(),
  days: z.number(),
  projection: z.array(z.object({
    date: z.string(),
    balance: z.number(),
  })),
  riskScore: z.enum(['green', 'yellow', 'red']),
  commentary: z.string(),
  suggestedAction: z.string().optional(),
});

export const BriefItemSchema = z.object({
  status: StatusSchema,
  text: z.string(),
  source: z.string().optional(),
});

export const CaptainBriefSchema = z.object({
  greeting: z.string(),
  items: z.array(BriefItemSchema),
  topPriority: z.string().optional(),
});

export const TraceStepSchema = z.object({
  agent: z.enum(['captain', 'seo', 'marketing', 'pricing', 'reviews', 'cashflow']),
  action: z.string(),
  calledBy: z.string().optional(),
  durationMs: z.number().optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  timestamp: z.string(),
});

export type SeoSuggestion = z.infer<typeof SeoSuggestionSchema>;
export type MarketingPost = z.infer<typeof MarketingPostSchema>;
export type PriceSuggestion = z.infer<typeof PriceSuggestionSchema>;
export type ReviewAnalysis = z.infer<typeof ReviewAnalysisSchema>;
export type CashFlowForecast = z.infer<typeof CashFlowForecastSchema>;
export type BriefItem = z.infer<typeof BriefItemSchema>;
export type CaptainBrief = z.infer<typeof CaptainBriefSchema>;
export type TraceStep = z.infer<typeof TraceStepSchema>;
