import { genkit } from 'genkit';
import { googleAI, gemini20FlashExp } from '@genkit-ai/googleai';
import { env } from '@/lib/env';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: env.GEMINI_API_KEY }),
  ],
  model: gemini20FlashExp,
});

export { gemini20FlashExp as flashModel } from '@genkit-ai/googleai';
// Use the same as proModel for now (will swap to a stronger Pro variant at runtime if available):
export { gemini20FlashExp as proModel } from '@genkit-ai/googleai';
