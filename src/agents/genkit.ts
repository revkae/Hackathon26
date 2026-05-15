import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { env } from '@/lib/env';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Dual-mode: prefer Vertex AI when GCP_PROJECT_ID is set, otherwise fall back
// to Google AI Studio using GEMINI_API_KEY (also auto-read from env var).
const useVertex = !!env.GCP_PROJECT_ID;

// When using Vertex AI with a service account JSON, the most reliable auth
// path is to write the SA key to a temp file and point
// GOOGLE_APPLICATION_CREDENTIALS at it — Genkit's vertexAI plugin then picks
// it up via the standard google-auth-library discovery.
if (useVertex && env.GCP_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const tmpDir = path.join(os.tmpdir(), 'kobi-kaptani-gcp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const keyPath = path.join(tmpDir, 'sa-key.json');
  fs.writeFileSync(keyPath, env.GCP_SERVICE_ACCOUNT_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
}

const plugin = useVertex
  ? vertexAI({
      projectId: env.GCP_PROJECT_ID,
      location: env.GCP_LOCATION,
    })
  : googleAI({
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
