import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit otimizada para produção.
 * Utiliza o modelo Gemini 1.5 Flash estável.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
