import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

config();

/**
 * Configuração do Genkit utilizando o plugin Google AI.
 * Removida a versão fixa para permitir que o plugin utilize a rota v1beta estável por defeito,
 * que é onde o modelo Gemini 1.5 Flash reside com suporte completo a media.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    })
  ],
});
