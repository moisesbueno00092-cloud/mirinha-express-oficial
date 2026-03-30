import 'server-only';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit otimizada para produção.
 * Utiliza o modelo Gemini 2.0 Flash para melhor performance em visão (OCR).
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
