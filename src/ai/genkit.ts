import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';

config();

/**
 * Configuração do Genkit forçando a API v1 para garantir estabilidade.
 * A v1 é a rota estável que evita o erro 404 do endpoint v1beta.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1'
    })
  ],
});
