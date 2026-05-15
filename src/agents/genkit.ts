import { genkit } from 'genkit';
import { vertexAI, gemini25FlashPreview0417, gemini25ProPreview0325 } from '@genkit-ai/vertexai';
import { env } from '@/lib/env';

// Parse service account JSON if provided (for Vercel/production).
// Falls back to ADC (Application Default Credentials) if not set (local dev via
// `gcloud auth application-default login`).
const credentials = env.GCP_SERVICE_ACCOUNT_JSON
  ? JSON.parse(env.GCP_SERVICE_ACCOUNT_JSON)
  : undefined;

export const ai = genkit({
  plugins: [
    vertexAI({
      location: env.GCP_LOCATION,
      projectId: env.GCP_PROJECT_ID,
      ...(credentials && {
        googleAuth: {
          credentials,
          projectId: env.GCP_PROJECT_ID,
        },
      }),
    }),
  ],
  model: gemini25FlashPreview0417,
});

// Re-export commonly used model refs
export { gemini25FlashPreview0417 as flashModel } from '@genkit-ai/vertexai';
export { gemini25ProPreview0325 as proModel } from '@genkit-ai/vertexai';
