import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuração central do Genkit otimizada para Vercel.
 * Utiliza a chave de API pública ou privada para garantir autenticação em produção.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
});
