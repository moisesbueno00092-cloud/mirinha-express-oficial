import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit otimizada para produção.
 * Utiliza o modelo Gemini 2.5 Flash como padrão mas permite fallbacks.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
