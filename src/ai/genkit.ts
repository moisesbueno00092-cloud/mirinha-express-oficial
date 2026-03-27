import {genkit} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit otimizada para Vercel.
 * Exporta o modelo gemini15Flash explicitamente para garantir resolução correta de endpoints.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
});

export { gemini15Flash };
