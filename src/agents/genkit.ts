import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { env } from '@/lib/env';

// Parse service account JSON if provided (for Vercel/production).
// Falls back to ADC (Application Default Credentials) if not set (local dev via
// `gcloud auth application-default login`).
const credentials = env.GCP_SERVICE_ACCOUNT_JSON
  ? JSON.parse(env.GCP_SERVICE_ACCOUNT_JSON)
  : undefined;

// Dual-mode: prefer Vertex AI when GCP_PROJECT_ID is set, otherwise fall back
// to Google AI Studio using GEMINI_API_KEY (also auto-read from env var).
const useVertex = !!env.GCP_PROJECT_ID;

const plugin = useVertex
  ? vertexAI({
      projectId: env.GCP_PROJECT_ID,
      location: env.GCP_LOCATION,
      ...(credentials && {
        googleAuth: {
          credentials,
          projectId: env.GCP_PROJECT_ID,
        },
      }),
    })
  : googleAI({
      // apiKey can be omitted here — the plugin also auto-reads GEMINI_API_KEY / GOOGLE_API_KEY env vars
      apiKey: env.GEMINI_API_KEY,
    });

// Model IDs use the plugin-namespace prefix that the @genkit-ai/google-genai
// package registers them under. Both plugins register the same model names but
// under different prefixes: 'googleai/' vs 'vertexai/'.
// Using string IDs (rather than ModelReference objects) avoids TypeScript union
// type conflicts between the two plugin schemas.
const modelPrefix = useVertex ? 'vertexai' : 'googleai';

export const ai = genkit({
  plugins: [plugin],
  model: `${modelPrefix}/gemini-2.5-flash`,
});

export const flashModel = `${modelPrefix}/gemini-2.5-flash` as const;
export const proModel = `${modelPrefix}/gemini-2.5-pro` as const;
