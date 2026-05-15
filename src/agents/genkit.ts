import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';
import { env } from '@/lib/env';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: env.GEMINI_API_KEY }),
  ],
  model: gemini20Flash,
});

export { gemini20Flash as flashModel } from '@genkit-ai/googleai';
// Use gemini-2.0-flash (stable, replaces deprecated gemini-2.0-flash-exp):
export { gemini20Flash as proModel } from '@genkit-ai/googleai';
